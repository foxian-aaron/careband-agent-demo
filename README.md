# 智護環 CareBand Agent Demo v0.2

CareBand Agent v0.2 is a landing-validation demo for an elderly care wearable and AI Agent workflow.

This repository contains:

- React + TypeScript + Vite frontend
- Node.js + Express backend
- SQLite local demo database
- Apple Health / Apple Watch daily snapshot import
- deterministic risk engine
- mock/OpenAI Agent fallback

The demo is not a medical diagnosis system. All AI output must include:

```text
本結果僅為照護風險提示，不構成醫療診斷。
```

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

Build the frontend:

```bash
npm run build
```

Start the backend:

```bash
npm run dev:backend
```

Then open:

```text
http://localhost:3001/#/elder/TEST001
```

In this mode, the Express backend serves both `/api/*` and the built frontend from `dist/`.

Public deployment notes:

```text
docs/deployment.md
docs/public_demo_checklist.md
```

## Apple Health Test Data

The demo supports Apple Health Export XML and derived CSV import.

Privacy rules:

- Do not commit raw Apple Health exports.
- Do not commit `export.zip`, `export.xml`, `apple_health_export/`, `private_data/`, SQLite DB files, uploads, or `.env`.
- Do not send raw XML to any LLM or external AI service.
- Agent analysis should only use daily aggregated snapshots.
- `TEST001` is labelled as team member Apple Watch test data, not real elderly user data.

Detailed privacy notes:

```text
docs/privacy_apple_health.md
```

Recommended safe workflow:

```bash
cd backend
npm run preview:apple-health -- ../private_data/apple_health/apple_health_export/export.xml
npm run derive:apple-health -- ../private_data/apple_health/apple_health_export/export.xml
```

The derived CSV is written to:

```text
private_data/derived/apple_watch_daily_snapshots.csv
```

It is ignored by Git.

Step source strategy defaults to `prefer_watch`, so Apple Watch step records are used before iPhone step records when both exist on the same day.

Reset local seeded demo data when preparing a repeatable presentation:

```bash
npm run seed:reset
```

Review and presentation docs:

```text
docs/review_pr_checklist.md
docs/pr_description.md
docs/demo_personas.md
docs/demo_script_chenbo.md
docs/demo_script_test001_apple_watch.md
docs/apple_health_import_report.template.md
```

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

Run backend tests:

```bash
cd backend
npm test
```

Run frontend tests and build:

```bash
npm test
npm run build
```

Current validated result:

- Backend tests: 7 passed
- Frontend Vitest: 31 passed
- TypeScript build: passed
- Vite build: passed

## Import Report

Safe Apple Health import report:

```text
docs/apple_health_import_report.md
```

The report includes only daily aggregated summaries and privacy confirmation. It does not include raw XML records, Apple ID, personal profile, clinical records, or raw time-series data.
