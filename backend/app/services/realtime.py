import time
import math
from dataclasses import dataclass, field
from fastapi import WebSocket
from typing import Dict, Optional, Set

def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000
    dlat = math.radians(lat2-lat1)
    dlon = math.radians(lon2-lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
    return 2*R*math.asin(math.sqrt(a))

@dataclass
class ConnState:
    lat: Optional[float] = None
    lng: Optional[float] = None
    accuracy_m: float = 9999
    ts: float = 0
    notified: Set[str] = field(default_factory=set)

class RealtimeRouter:
    def __init__(self):
        self.connections: Dict[WebSocket, ConnState] = {}

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections[ws] = ConnState()

    def disconnect(self, ws: WebSocket):
        self.connections.pop(ws, None)

    def update_location(self, ws: WebSocket, lat, lng, acc):
        st = self.connections.get(ws)
        if not st: return
        st.lat = lat
        st.lng = lng
        st.accuracy_m = acc
        st.ts = time.time()

    async def broadcast_alert(self, incident_id, lat, lng, radius, payload):
        now = time.time()

        for ws, st in list(self.connections.items()):
            if not st.lat: continue
            if now - st.ts > 120: continue
            if incident_id in st.notified: continue

            buffer = min(st.accuracy_m, 200)
            dist = haversine_m(lat, lng, st.lat, st.lng)

            if dist <= radius + buffer:
                st.notified.add(incident_id)
                await ws.send_json(payload)

router = RealtimeRouter()