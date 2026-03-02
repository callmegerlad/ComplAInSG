from fastapi import APIRouter, WebSocket
from app.services.realtime import router

ws_router = APIRouter()

@ws_router.websocket("/ws/alerts")
async def ws_alerts(ws: WebSocket):
    await router.connect(ws)

    try:
        while True:
            msg = await ws.receive_json()

            if msg.get("type") == "LOCATION_UPDATE":
                router.update_location(
                    ws,
                    float(msg["lat"]),
                    float(msg["lng"]),
                    float(msg.get("accuracy_m", 9999))
                )

                await ws.send_json({"type":"ACK"})
    except Exception:
        # All ordinary exceptions (connection resets, JSON errors, etc.)
        router.disconnect(ws)
    except BaseException:
        # Re-raise critical system signals (KeyboardInterrupt, SystemExit, …)
        router.disconnect(ws)
        raise