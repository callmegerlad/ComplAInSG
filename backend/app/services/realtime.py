import time
import math
from dataclasses import dataclass, field
from fastapi import WebSocket
from typing import Dict, Any, List, Optional, Set

def haversine_m(lat1, lon1, lat2, lon2) -> float:
    R = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dlon/2)**2
    return 2 * R * math.asin(math.sqrt(a))

@dataclass
class ConnState:
    lat: Optional[float] = None
    lng: Optional[float] = None
    accuracy_m: float = 9999.0
    ts: float = 0.0
    notified: Set[str] = field(default_factory=set)  # incident_ids

@dataclass
class ActiveIncident:
    id: str
    lat: float
    lng: float
    radius_m: int
    payload: Dict[str, Any]
    created_ts: float

class RealtimeRouter:
    def __init__(self):
        self.conns: Dict[WebSocket, ConnState] = {}
        self.active_incidents: List[ActiveIncident] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.conns[ws] = ConnState()

    def disconnect(self, ws: WebSocket):
        self.conns.pop(ws, None)

    def update_location(self, ws: WebSocket, lat: float, lng: float, accuracy_m: float):
        st = self.conns.get(ws)
        if not st:
            return
        st.lat = lat
        st.lng = lng
        st.accuracy_m = accuracy_m
        st.ts = time.time()

    def _purge_old_incidents(self, ttl_sec: int = 900):
        now = time.time()
        self.active_incidents = [i for i in self.active_incidents if now - i.created_ts <= ttl_sec]

    async def on_incident_alert_ready(self, incident: ActiveIncident):
        """
        Event-driven: called when a new incident becomes alert-worthy.
        Checks all connected users ONCE.
        """
        self._purge_old_incidents()
        self.active_incidents.append(incident)

        now = time.time()
        for ws, st in list(self.conns.items()):
            # must have fresh location
            if st.lat is None or st.lng is None or (now - st.ts) > 120:
                continue
            if incident.id in st.notified:
                continue

            # accuracy-aware buffer (cap so it doesn't explode)
            buffer_m = min(max(st.accuracy_m, 0), 200)

            d = haversine_m(incident.lat, incident.lng, st.lat, st.lng)
            if d <= (incident.radius_m + buffer_m):
                st.notified.add(incident.id)
                await ws.send_json(incident.payload)

    async def on_location_update_check_nearby(self, ws: WebSocket):
        """
        Optional: called after LOCATION_UPDATE.
        Checks this user against active incidents only (small list), not DB.
        """
        st = self.conns.get(ws)
        if not st or st.lat is None or st.lng is None:
            return

        self._purge_old_incidents()
        buffer_m = min(max(st.accuracy_m, 0), 200)

        for inc in self.active_incidents:
            if inc.id in st.notified:
                continue
            d = haversine_m(inc.lat, inc.lng, st.lat, st.lng)
            if d <= (inc.radius_m + buffer_m):
                st.notified.add(inc.id)
                await ws.send_json(inc.payload)

router = RealtimeRouter()