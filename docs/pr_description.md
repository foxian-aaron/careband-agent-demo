# Summary

This PR upgrades the frontend-only CareBand demo into CareBand Agent v0.2, a
landing-validation demo for the full care loop:

wearable data -> DailySnapshot -> personal baseline -> riskEngine -> AI Agent
summary -> caregiver task -> family/institution visibility.

# What Changed

- Added a minimal Node.js + Express + SQLite backend.
- Added dashboard, snapshot, event, task, import, and Agent API endpoints.
- Added Apple Health XML preview and derived CSV import workflow.
- Added deterministic risk rules before AI summary generation.
- Added mock/OpenAI Agent fallback with a required medical disclaimer.
- Added TEST001 for team Apple Watch test data.
- Kept the original frontend UI and mock/localStorage fallback.
- Added production single-port serving from Express.

# How To Run

```bash
npm install
cd backend
npm install
cd ..
npm run dev
```

Frontend:

```text
http://localhost:5173/
```

Backend:

```text
http://localhost:3001/api/health
```

Single-port production smoke test:

```bash
npm run build
cd backend
npm start
```

Open:

```text
http://localhost:3001/#/elder/TEST001
```

# How To Test

```bash
cd backend
npm test
cd ..
npm test
npm run build
```

# Demo Flow

Main scripted care-loop demo:

1. Open E001.
2. Trigger voice symptom.
3. Trigger SOS.
4. Confirm a caregiver task was created.
5. Generate/view Agent summaries.
6. Accept, check, confirm medication, and complete the task.

Apple Watch import demo:

1. Preview Apple Health XML locally.
2. Derive daily aggregated CSV.
3. Import 7-14 daily snapshots into TEST001.
4. Open TEST001 and show Apple Health Export data source.

# Privacy Notes

- Raw Apple Health XML/ZIP files are not committed.
- SQLite DB files are ignored.
- `.env` files are ignored.
- Raw Apple Health XML must not be sent to OpenAI, QwenPaw, or other LLMs.
- Agent analysis uses only daily aggregated snapshots.
- TEST001 is team member Apple Watch test data, not real elder data.
- The system is a care-risk prompt demo, not a medical diagnosis system.

# Remaining Risks

- Apple Health XML exports can be very large; the recommended workflow is local
  preview/derive -> daily CSV import.
- SQLite is suitable for the demo, not a commercial multi-user backend.
- Public deployment needs a stable Node host; temporary tunnels should not be
  used for final review.

