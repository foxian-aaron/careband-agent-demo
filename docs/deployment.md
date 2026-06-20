# CareBand Agent v0.2 Deployment

This demo supports a single-port production mode: the Express backend serves
both `/api/*` and the built Vite frontend from `dist/`.

## Local Production Smoke Test

From the repository root:

```bash
npm install
cd backend
npm install
cd ..
npm run build
cd backend
npm start
```

Open:

```text
http://localhost:3001/api/health
http://localhost:3001/#/elder/TEST001
```

Expected:

- `/api/health` returns JSON, not HTML.
- `/#/elder/TEST001` loads the React app.
- The frontend and backend use the same origin in production.

## Environment Variables

Backend:

```text
PORT=3001
DATABASE_PATH=data/careband.sqlite
CORS_ORIGIN=*
USE_MOCK_AGENT=true
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
AGENT_TIMEOUT_MS=30000
APPLE_HEALTH_STEP_SOURCE_STRATEGY=prefer_watch
ENABLE_DEMO_RESET=false
```

Frontend:

```text
VITE_API_BASE_URL=
VITE_API_TIMEOUT_MS=8000
VITE_AGENT_TIMEOUT_MS=30000
```

For local Vite development, `VITE_API_BASE_URL` can be:

```text
http://localhost:3001
```

For single-port production, leave `VITE_API_BASE_URL` unset so the frontend
calls same-origin `/api/*`.

## Hosting Options

Use any Node-compatible host that can run the backend and persist a small
SQLite file, for example:

- Render Web Service
- Railway service
- Fly.io app with a volume
- Alibaba Cloud ECS
- any VM or container host with Node.js

Recommended production start command:

```bash
npm run build
cd backend
npm install
npm start
```

If the host builds from the repository root, run backend install first or use a
build script such as:

```bash
npm install && cd backend && npm install && cd .. && npm run build
```

## Do Not Use Temporary Anonymous Tunnels For Final Review

Serveo, localtunnel, ngrok free quick links, and other anonymous tunnels can
show warning pages or disappear during review. They are useful for a quick local
check, but final judges/reviewers should receive a clean deployment URL.

## Public Verification

Replace `<public-url>` with the deployed origin:

```bash
curl -i <public-url>/api/health
```

Expected headers/content:

```text
HTTP/2 200
content-type: application/json
```

Then open:

```text
<public-url>/#/elder/TEST001
```

The dashboard should show:

- backend connected
- `data_source = Apple Health Export` when imported
- data quality badge
- Agent source badge
- medical disclaimer
- TEST001 labelled as team Apple Watch test data

