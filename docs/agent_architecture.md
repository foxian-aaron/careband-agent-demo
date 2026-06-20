# CareBand Agent Architecture

CareBand v0.2 separates deterministic risk classification from Agent summarization.

## Chain

```text
wearable data
-> DailySnapshot
-> personal baseline
-> deterministic riskEngine
-> /api/agent/analyze
-> role-based summaries
-> caregiver task
-> family / institution visibility
```

## deterministic riskEngine

The risk engine handles explainable classification before any LLM output.

Examples:

- low `data_quality` -> `insufficient_data`
- `fall_detected` -> `urgent`
- `sos_long_press` -> `high_risk`
- symptom text such as `頭暈` / `胸悶` / `跌倒` / `不舒服` -> at least `attention`
- activity and sleep drops vs personal baseline -> `observe` / `attention`

This layer is intentionally deterministic so reviewers can inspect why a risk level changed.

## Agent Summarization

The Agent does not invent a diagnosis. It converts structured inputs into role-specific communication:

- caregiver summary
- family summary
- institution summary
- recommended action
- key reasons
- safety disclaimer

Every output must include:

```text
本結果僅為照護風險提示，不構成醫療診斷。
```

## Current Providers

- `mockAgent`: default fallback; works without API keys.
- `openaiAgent`: used only when `OPENAI_API_KEY` exists and `USE_MOCK_AGENT !== true`.

API keys live only in the backend `.env`; the frontend never receives them.

## QwenPaw-Style Integration Point

The v0.2 interface is prepared for a future QwenPaw-compatible provider:

```text
POST /api/agent/analyze
```

Future QwenPaw integration can replace the backend implementation behind this endpoint without rewriting:

- frontend pages
- DailySnapshot import
- baseline calculation
- deterministic riskEngine
- task UI

Do not claim QwenPaw is fully integrated in v0.2. The correct wording is:

```text
QwenPaw-style Agent interface prepared.
Future integration point: /api/agent/analyze.
```

## Privacy Boundary

The Agent may receive daily aggregated snapshots, risk results, and event summaries. It must not receive raw Apple Health XML, raw heart-rate time series, Apple ID, or full personal profile data.

