# Summary

This PR upgrades the CareBand Agent demo into v0.2 landing validation:

```text
wearable data -> DailySnapshot -> personal baseline -> riskEngine -> AI Agent summaries -> caregiver task -> family / institution visibility
```

It keeps the original demo available at the GitHub Pages root and deploys v0.2 as a separate static preview under `/v0.2/`.

# Public Demo Links

Original demo:

- https://foxian-aaron.github.io/careband-agent-demo/#/institution
- https://foxian-aaron.github.io/careband-agent-demo/#/elder/E001/profile
- https://foxian-aaron.github.io/careband-agent-demo/#/medication/E001

v0.2 static preview:

- https://foxian-aaron.github.io/careband-agent-demo/v0.2/#/institution
- https://foxian-aaron.github.io/careband-agent-demo/v0.2/#/elder/TEST001
- https://foxian-aaron.github.io/careband-agent-demo/v0.2/#/elder/E001/profile
- https://foxian-aaron.github.io/careband-agent-demo/v0.2/#/medication/E001

# Static Preview Caveat

GitHub Pages is static only. The public `/v0.2/` preview uses mock fallback data and does not run Express, SQLite, OpenAI, or backend API routes. Full backend mode requires local startup or a Node-compatible host.

# What Changed

- Added minimal Node.js + Express + SQLite backend.
- Added dashboard, snapshot, event, task, import, and Agent API endpoints.
- Added Apple Health XML preview and derived CSV import workflow.
- Added deterministic risk rules before AI summary generation.
- Added mock/OpenAI Agent fallback with required medical disclaimer.
- Added TEST001 for team Apple Watch test data and clearly labelled it as non-real elder data.
- Kept E001 / 陳伯 as the main scripted care-loop demo.
- Stopped unknown elder routes from falling back to E001.
- Added a visible GitHub Pages static preview banner.
- Added CI coverage for v0.2 backend tests.

# How To Run Original Demo

From the root `careband-agent-demo` checkout:

```bash
npm install
npm test
npm run build
npm run dev
```

# How To Run v0.2 Frontend

From `careband-agent-demo-v0.2` or the `careband-v0.2-apple-health` branch:

```bash
npm install
npm test
npm run build
npm run dev:frontend
```

# How To Run v0.2 Backend

```bash
cd backend
npm install
npm test
npm start
```

Backend health:

```text
http://localhost:3001/api/health
```

# How To Test

Original demo:

```bash
npm test
npm run build
```

v0.2 frontend:

```bash
npm test
npm run build
```

v0.2 backend:

```bash
cd backend
npm test
```

Optional public smoke:

```bash
npm run check:public
```

# TEST001 / E001 Explanation

- `TEST001` = team Apple Watch test data, non-real elder, used to validate Apple Health / Apple Watch daily snapshot import.
- `E001` = 陳伯 Demo 情境, simulated elder care-loop scenario for activity decline, dizziness, SOS, caregiver task, Agent summaries, and family/institution visibility.

# Apple Health Privacy Notes

- Raw Apple Health XML/ZIP files are not committed.
- SQLite DB files are ignored.
- `.env` files are ignored.
- Raw Apple Health XML must not be sent to OpenAI, QwenPaw, or other LLMs.
- Agent analysis uses only daily aggregated snapshots, risk results, and event summaries.
- Direct XML upload is only for development or small files; recommended workflow is local preview/derive -> daily CSV import.

# Medical Boundary

All Agent outputs must include:

```text
本結果僅為照護風險提示，不構成醫療診斷。
```

# Remaining Risks

- GitHub Pages cannot demonstrate the real backend; use local or Node hosting for full end-to-end review.
- Apple Health XML exports can be very large; use local preview/derive CSV.
- SQLite is suitable for demo validation, not commercial multi-user deployment without further architecture work.
- QwenPaw-style Agent interface is prepared through `/api/agent/analyze`; QwenPaw is not claimed as fully integrated.

