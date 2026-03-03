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
            ir.id,
            ir.location_text,
            ir.description,
            ir.latitude,
            ir.longitude,
            ir.created_at,
            ft.incident_type,
            ft.final_severity,
            ft.routing_target,
            ft.responder_summary,
            (
              SELECT ma.url
              FROM media_assets ma
              WHERE ma.report_id = ir.id AND ma.media_type = 'IMAGE'
              ORDER BY ma.created_at DESC
              LIMIT 1
            ) AS image_url
          FROM incident_reports ir
          LEFT JOIN final_triage ft ON ft.report_id = ir.id
          WHERE ir.latitude IS NOT NULL AND ir.longitude IS NOT NULL
            AND ir.latitude BETWEEN :lat_min AND :lat_max
            AND ir.longitude BETWEEN :lng_min AND :lng_max
        ),
        distances AS (
          SELECT
            id,
            location_text,
            description,
            latitude,
            longitude,
            created_at,
            incident_type,
            final_severity,
            routing_target,
            responder_summary,
            image_url,
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
            "created_at": r["created_at"],
            "incident_type": r["incident_type"],
            "final_severity": r["final_severity"],
            "routing_target": r["routing_target"],
            "responder_summary": r["responder_summary"],
            "image_url": r["image_url"],
            "distance_m": float(r["distance_m"]),
        }
        for r in rows
    ]
