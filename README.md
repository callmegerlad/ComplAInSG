# ComplAInSG

AI-powered community incident reporting and triage platform.

ComplAInSG lets users submit incidents (with optional image), triage reports with AI, surface nearby incidents, and receive realtime location-aware alerts.

## Tech Stack

- Frontend: React + Vite + TypeScript + React Router
- Backend: FastAPI + SQLAlchemy + Alembic
- Database: PostgreSQL
- Realtime: WebSocket alerts
- Infra: Docker Compose

## Repository Structure

```text
.
+-- backend/
¦   +-- app/
¦   ¦   +-- routes/         # users, incidents, alerts, ws_alerts
¦   ¦   +-- models/         # users, triage, media, alert_events
¦   ¦   +-- schemas/        # request/response models
¦   ¦   +-- services/       # nearby + realtime logic
¦   ¦   +-- main.py         # FastAPI entrypoint
¦   +-- alembic/            # DB migrations
¦   +-- requirements.txt
¦   +-- .env.example
+-- frontend/
¦   +-- src/app/pages/      # Home, Map, Notifications, Profile, Search
¦   +-- src/app/providers/  # AuthProvider, AlertsProvider
¦   +-- src/lib/            # API clients (auth/incidents/alerts/location)
¦   +-- package.json
+-- testbench/              # judge testing assets and runbook
+-- docker-compose.yml
```

## Key Features

- User registration/login and profile (`/users/*`)
- Incident submission + AI triage (`POST /incidents/triage`)
- Incident list/detail/search/nearby endpoints
- Media upload and serving from `/uploads/*`
- Realtime websocket alerts based on user location (`/ws/alerts`)
- Alert feed + event tracking (`/alerts/feed`, `/alerts/events`)
- Profile trust/badges/responses based on activity

## Prerequisites

- Docker + Docker Compose (recommended)
- Or for local non-Docker run:
  - Python 3.11+
  - Node.js 20+
  - PostgreSQL 15+

## Option A: Run with Docker (Recommended)

From repository root:

```bash
docker compose up --build
```

App URLs:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs

Run DB migrations (first run and after schema changes):

```bash
cd backend
alembic upgrade head
```

## Option B: Run Locally (Without Docker)

### 1) Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env` from `backend/.env.example`:

```env
OPENAI_API_KEY=your_openai_api_key_here
MODEL_NAME=gpt-4.1-mini
DATABASE_URL=postgresql://complainsg:complainsg@localhost:5432/complainsg
ALLOWED_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
ALLOWED_ORIGIN_REGEX=https?://(localhost|127\.0\.0\.1)(:\d+)?
JWT_SECRET_KEY=complainsg-jwt-secret-key
```

Then run:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Set API URL if needed:

```env
VITE_API_URL=http://localhost:8000
```

## Core API Endpoints

### Health
- `GET /health`

### Users/Auth
- `POST /users/register`
- `POST /users/login`
- `GET /users/me`
- `PATCH /users/me`
- `DELETE /users/me`

### Incidents
- `POST /incidents/triage`
- `GET /incidents`
- `GET /incidents/{incident_id}`
- `GET /incidents/search`
- `GET /incidents/nearby`

### Alerts
- `GET /alerts/feed`
- `POST /alerts/events`
- `WS /ws/alerts`

## Realtime Alert Flow

1. Frontend opens websocket to `/ws/alerts`.
2. Frontend sends `LOCATION_UPDATE` messages.
3. Backend checks user distance against incident alert radius.
4. Backend pushes `ALERT` payloads for nearby incidents.
5. Frontend shows bell badge + Notifications list.
6. User actions are tracked via `/alerts/events` (`received`, `open`, `view_incident`, `responding`).

## Testbench for Judges

Use the provided testbench assets:

- [testbench/SETUP_AND_RUN.md](testbench/SETUP_AND_RUN.md)
- [testbench/requests.http](testbench/requests.http)
- [testbench/sample_payloads/](testbench/sample_payloads)
- [testbench/expected_results.md](testbench/expected_results.md)

## Common Troubleshooting

- CORS blocked: verify `ALLOWED_ORIGINS` includes frontend URL.
- Migrations missing: run `alembic upgrade head`.
- No alerts: grant browser location permission and keep app open.
- Upload image 404: confirm file exists in `backend/uploads` and URL is `/uploads/<filename>`.

## License

Deep Learning Week 2026 project/demo use.