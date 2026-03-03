# Testbench Setup and Run Guide

This guide is for judges to run and validate ComplAInSG end-to-end.

## 1) Prerequisites

- Docker Desktop with Docker Compose
- Ports available: `5173`, `8000`, `5432`

## 2) Start Services

From repo root:

```bash
docker compose up --build
```

Expected:

- Frontend at `http://localhost:5173`
- Backend at `http://localhost:8000`
- Docs at `http://localhost:8000/docs`

## 3) Run Database Migrations

Open a new terminal:

```bash
cd backend
alembic upgrade head
```

## 4) Create Test User (API)

Use one of these:

- Swagger UI: `http://localhost:8000/docs`
- VS Code REST client with `testbench/requests.http`
- curl/Postman with payloads in `testbench/sample_payloads/`

Steps:

1. `POST /users/register`
2. `POST /users/login`
3. Copy `access_token`

## 5) Submit Test Incident

Call:

- `POST /incidents/triage`

Use payload from `testbench/sample_payloads/triage_incident.json`.

Note:

- `image_url` expects base64 data URL (`data:image/jpeg;base64,...`).
- For quick API-only testing, you may use a short placeholder base64 string and focus on endpoint behavior.

## 6) Validate Incident APIs

Call:

1. `GET /incidents`
2. `GET /incidents/{incident_id}`
3. `GET /incidents/search?query=...`
4. `GET /incidents/nearby?lat=...&lng=...`

Confirm responses contain expected incident, severity, and location fields.

## 7) Validate Frontend Flows

In browser (`http://localhost:5173`):

1. Login with test user.
2. Home/Map shows incidents from backend.
3. Search page returns results for keyword/type/severity.
4. Open an incident detail page.
5. Tap `ON MY WAY`.
6. Go to Profile and confirm `Responses` increments.

## 8) Validate Alerts Flow

1. Keep Notifications page open and allow location permission.
2. Create a nearby high-severity incident.
3. Confirm bell badge increases and card appears in Notifications.
4. Open Notifications: alerts mark as read.
5. Open incident detail: `view_incident` event should be logged.

## 9) Optional API Validation for Alerts

- `GET /alerts/feed?lat=...&lng=...`
- `POST /alerts/events` with event types:
  - `received`
  - `open`
  - `view_incident`
  - `responding`

## 10) Expected Outcomes

Use `testbench/expected_results.md` to compare expected output and behavior.