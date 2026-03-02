from sqlalchemy.orm import Session
from sqlalchemy import text


def fetch_nearby_incidents(
    db: Session,
    lat: float,
    lng: float,
    radius_m: int,
    limit: int,
):
    q = text("""
        SELECT
          id,
          location_text,
          description,
          latitude,
          longitude,
          ST_Distance(
            location,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
          ) AS distance_m
        FROM incident_reports
        WHERE location IS NOT NULL
          AND ST_DWithin(
            location,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radius_m
          )
        ORDER BY distance_m
        LIMIT :limit;
    """)

    rows = db.execute(
        q,
        {"lat": lat, "lng": lng, "radius_m": radius_m, "limit": limit},
    ).mappings().all()

    return [
        {
            "incident_id": r["id"],
            "location": r["location_text"],
            "description": r["description"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "distance_m": float(r["distance_m"]),
        }
        for r in rows
    ]