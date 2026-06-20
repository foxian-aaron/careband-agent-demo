# 智護環 CareBand Agent Demo v0.2

CareBand Agent v0.2 是學生 AI 競賽用的落地驗證 demo。核心流程不是單純健康看板，而是：

```text
wearable data -> DailySnapshot -> personal baseline -> riskEngine -> AI Agent summaries -> caregiver task -> family / institution visibility
```

本系統只做照護風險提示，不做醫療診斷。所有 Agent 輸出都必須保留：

```text
本結果僅為照護風險提示，不構成醫療診斷。
```

## Current Public Demo Status

- Original demo root path:
  - https://foxian-aaron.github.io/careband-agent-demo/#/institution
  - https://foxian-aaron.github.io/careband-agent-demo/#/elder/E001/profile
  - https://foxian-aaron.github.io/careband-agent-demo/#/medication/E001
- v0.2 static preview:
  - https://foxian-aaron.github.io/careband-agent-demo/v0.2/#/institution
  - https://foxian-aaron.github.io/careband-agent-demo/v0.2/#/elder/TEST001
  - https://foxian-aaron.github.io/careband-agent-demo/v0.2/#/elder/E001/profile
  - https://foxian-aaron.github.io/careband-agent-demo/v0.2/#/medication/E001

Important: GitHub Pages is static only. The `/v0.2/` public link uses mock fallback data and does not run Express, SQLite, OpenAI, or backend API routes. Full backend mode must be run locally or deployed to a Node-compatible host.

## Demo Personas

- `TEST001`: 團隊 Apple Watch 測試資料，非真實長者，用於驗證 Apple Health / Apple Watch 每日聚合資料導入。
- `E001` 陳伯：主照護閉環 demo，展示活動下降、頭暈、SOS、護工任務、Agent 摘要與三端同步。

Unknown elder routes intentionally do not fallback to E001. They show `資料未載入：找不到此長者資料。`

## Quick Start

Install dependencies:

```bash
npm install
cd backend
npm install
cd ..
```

Run frontend and backend together:

```bash
npm run dev
```

Default URLs:

- Frontend: http://localhost:5173/
- Backend health: http://localhost:3001/api/health

If the machine does not have a global npm, use:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-demo.ps1
```

## Single-Port Production Smoke Test

```bash
npm run build
cd backend
npm start
```

Then open:

```text
http://localhost:3001/api/health
http://localhost:3001/#/elder/TEST001
```

In this mode, Express serves both `/api/*` and the built frontend from `dist/`.

## Apple Health Test Data

Recommended real-data flow for large Apple Health exports:

```bash
cd backend
npm run preview:apple-health -- ../private_data/apple_health/export.xml
npm run derive:apple-health -- ../private_data/apple_health/export.xml
```

The derived daily CSV is written to:

```text
private_data/derived/apple_watch_daily_snapshots.csv
```

Then import the derived CSV through the backend CSV endpoint. Direct XML upload is only for development or small files. GitHub Pages cannot import XML because it has no backend.

Privacy rules:

- Do not commit raw Apple Health exports.
- Do not commit `export.zip`, `export.xml`, `apple_health_export/`, `private_data/`, SQLite DB files, uploads, or `.env`.
- Do not send raw XML to OpenAI, QwenPaw, or any external LLM.
- Agent analysis receives only daily aggregated snapshots, risk results, and event summaries.
- `TEST001` must remain labelled as team Apple Watch test data, not real elderly user data.

## API Highlights

- `GET /api/health`
- `GET /api/elders`
- `GET /api/dashboard`
- `POST /api/snapshots`
- `POST /api/events`
- `POST /api/import/daily-snapshots-csv`
- `POST /api/import/apple-health-xml/preview`
- `POST /api/import/apple-health-xml`
- `POST /api/agent/analyze`
- `PATCH /api/tasks/:id`

## Validation

```bash
cd backend
npm test
cd ..
npm test
npm run build
```

Current validated result after the public-demo hardening pass:

- Original demo frontend tests: 31 passed
- v0.2 backend tests: 13 passed
- v0.2 frontend tests: 38 passed
- TypeScript: passed
- Vite build: passed
- Public Pages smoke check: passed
- GitHub Actions static build/deploy: runs on push to `main`

## Key Docs

- `docs/public_demo_checklist.md`
- `docs/deployment.md`
- `docs/agent_architecture.md`
- `docs/privacy_apple_health.md`
- `docs/apple_health_import_report.md`
- `docs/demo_script_chenbo.md`
- `docs/demo_script_test001_apple_watch.md`
- `docs/pr_description.md`
- `docs/review_pr_checklist.md`
