# Expected Results Checklist

## Service Health

- `GET /health` returns:
  - `healthy: true`

## Auth

- Register returns `201` with `access_token` and `user` object.
- Login returns `200` with `access_token` and same user profile.
- `GET /users/me` with token returns user profile and stats.

## Incident Submission and Retrieval

- `POST /incidents/triage` returns:
  - `incident_id`
  - `final` triage object
- `GET /incidents` includes the new incident.
- `GET /incidents/{id}` returns incident detail.
- `GET /incidents/search` returns matching entries.
- `GET /incidents/nearby` returns entries within radius if coordinates are close.

## Alerts

- `GET /alerts/feed` returns alerts sorted by:
  1. highest severity
  2. nearest distance
  3. newest created time
- `POST /alerts/events` returns:
  - `success: true`
  - `deduplicated: false` on first event
  - `deduplicated: true` for same `(user, incident, event_type)` repeated

## Frontend UX

- Bell badge count increases when unread alerts exist.
- Notifications page lists alerts with type/severity/proximity.
- Opening Notifications marks alerts read.
- Incident Details `ON MY WAY` logs `responding` event.
- Profile `Responses` reflects responding count.

## Notes

- For websocket realtime alerts, location permission must be allowed.
- If schema fields are missing, run `alembic upgrade head`.