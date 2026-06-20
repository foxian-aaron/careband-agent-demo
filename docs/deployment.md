# CareBand Agent v0.2 Deployment

## Public Paths

- Original static demo root:
  - `https://foxian-aaron.github.io/careband-agent-demo/#/institution`
- v0.2 static preview:
  - `https://foxian-aaron.github.io/careband-agent-demo/v0.2/#/institution`
  - `https://foxian-aaron.github.io/careband-agent-demo/v0.2/#/elder/TEST001`

The app uses hash routing (`#/...`) so GitHub Pages can serve every deep link from the same static `index.html`. The v0.2 Vite build uses relative assets, so JS/CSS files load correctly under `/careband-agent-demo/v0.2/`.

## GitHub Pages Static Preview

GitHub Pages deploys static frontend files only.

It does not run:

- Express
- SQLite
- OpenAI calls
- `/api/*` backend routes
- Apple Health XML or CSV import endpoints

Therefore the public `/v0.2/` preview must display a static preview banner and use frontend mock fallback data.

## Local Full Backend Mode

From the v0.2 repository root:

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

- `/api/health` returns JSON.
- `/#/elder/TEST001` loads the React app.
- The UI says `後端已連接：Express + SQLite`.
- TEST001 is labelled as team Apple Watch test data, not real elder data.
- Agent outputs include `本結果僅為照護風險提示，不構成醫療診斷。`

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

For local Vite development, set:

```text
VITE_API_BASE_URL=http://localhost:3001
```

For single-origin production, leave `VITE_API_BASE_URL` unset so the frontend calls same-origin `/api/*`.

## Full Backend Public Deployment

Use a Node-compatible host for the complete backend demo. Do not fake this on GitHub Pages.

### Render

- Root/build command:

```bash
npm install && cd backend && npm install && cd .. && npm run build
```

- Start command:

```bash
cd backend && npm start
```

- Env vars: `PORT`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `USE_MOCK_AGENT`, `AGENT_TIMEOUT_MS`.
- Privacy: do not upload raw Apple Health XML/ZIP to the repo.
- SQLite warning: use a persistent disk if the demo must retain imported snapshots.

### Railway

- Build command:

```bash
npm install && cd backend && npm install && cd .. && npm run build
```

- Start command:

```bash
cd backend && npm start
```

- Add the same env vars as Render.
- Check Railway volume/persistence settings before relying on SQLite data.

### Fly.io

- Build with Node and run `backend/src/server.js` after frontend build.
- Attach a volume for `backend/data/` if SQLite data must persist.
- Verify `PORT` binding follows Fly's runtime port.

### Alibaba Cloud ECS

- Install Node.js 24 or another compatible Node version.
- Clone the repo, install frontend/backend dependencies, run `npm run build`, then run `cd backend && npm start`.
- Use a process manager such as systemd or pm2.
- Store `.env` on the server only, never in Git.
- Keep raw Apple Health files under an ignored/private directory and delete them after deriving daily CSV if not needed.

### Generic Node Host

Minimum commands:

```bash
npm install
cd backend
npm install
cd ..
npm run build
cd backend
npm start
```

Verification:

```bash
curl <public-url>/api/health
```

Then open:

```text
<public-url>/#/elder/TEST001
```

Expected:

- backend connected label
- `data_source = Apple Health Export`
- `data_quality`
- Agent source badge
- medical disclaimer

## Apple Health Import Deployment Notes

Direct browser XML upload is for development or small files only. Real Apple Health `export.xml` can be very large.

Recommended real-data flow:

```bash
cd backend
npm run preview:apple-health -- ../private_data/apple_health/export.xml
npm run derive:apple-health -- ../private_data/apple_health/export.xml
```

Then import `private_data/derived/apple_watch_daily_snapshots.csv` with the CSV endpoint. GitHub Pages cannot run this import because it has no backend.

## Public Smoke Check

From the v0.2 root:

```bash
npm run check:public
```

This lightweight check loads the original root HTML, v0.2 HTML, and v0.2 referenced JS/CSS assets. It does not replace manual browser QA.

