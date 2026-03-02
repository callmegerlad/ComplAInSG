import math
from sqlalchemy.orm import Session
from sqlalchemy import text

def fetch_nearby_incidents(
    db: Session,
    lat: float,
    lng: float,
    radius_m: int,
    limit: int,
):
    # bounding box (degrees) to reduce candidates before Haversine
    lat_delta = radius_m / 111_320.0
    lng_delta = radius_m / (111_320.0 * max(math.cos(math.radians(lat)), 0.01))

    q = text("""
        WITH candidates AS (
          SELECT
            id,
            location_text,
            description,
            latitude,
            longitude
          FROM incident_reports
          WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            AND latitude BETWEEN :lat_min AND :lat_max
            AND longitude BETWEEN :lng_min AND :lng_max
        ),
        distances AS (
          SELECT
            id,
            location_text,
            description,
            latitude,
            longitude,
            (6371000 * 2 * asin(sqrt(
              power(sin(radians(latitude - :lat) / 2), 2) +
              cos(radians(:lat)) * cos(radians(latitude)) *
              power(sin(radians(longitude - :lng) / 2), 2)
            ))) AS distance_m
          FROM candidates
        )
        SELECT *
        FROM distances
        WHERE distance_m <= :radius_m
        ORDER BY distance_m
        LIMIT :limit;
    """)

    params = {
        "lat": lat, "lng": lng, "radius_m": radius_m, "limit": limit,
        "lat_min": lat - lat_delta, "lat_max": lat + lat_delta,
        "lng_min": lng - lng_delta, "lng_max": lng + lng_delta,
    }

    rows = db.execute(q, params).mappings().all()

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