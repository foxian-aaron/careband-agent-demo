# Public Demo Checklist

Before sharing a public CareBand Agent v0.2 link, verify:

- `/api/health` returns JSON directly.
- No browser warning page appears before the app.
- `/#/elder/TEST001` loads from the same public origin.
- Dashboard shows backend connected or a clear mock fallback badge.
- `data_source` is visible.
- `data_quality` is visible.
- Agent source is visible: `mock fallback` or `OpenAI`.
- The medical disclaimer is visible near Agent output.
- TEST001 is labelled as team Apple Watch test data, not real elder data.
- E001 is labelled as the scripted demo elder story.
- Demo buttons clearly state which elder they affect.
- Raw Apple Health XML/ZIP files are not deployed.
- `.env` and SQLite files are not committed.

Suggested quick checks:

```bash
curl -i <public-url>/api/health
```

Open:

```text
<public-url>/#/elder/TEST001
<public-url>/#/elder/E001
```

