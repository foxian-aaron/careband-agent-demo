# Apple Health Privacy Rules

Apple Health exports contain sensitive personal health data. Treat them as
private local files.

## Rules

- Do not commit raw Apple Health exports.
- Do not commit `export.zip`, `export.xml`, or `apple_health_export/`.
- Do not upload raw XML to public services.
- Do not send raw XML to OpenAI, QwenPaw, or other LLMs.
- Do not print raw XML records in logs.
- Use aggregated DailySnapshot rows for demo and Agent analysis.
- Keep raw files under `private_data/`.
- Keep derived CSV files under `private_data/derived/`.
- TEST001 is team member Apple Watch test data, not real elder data.
- Demo data should be anonymized before sharing.

## Recommended Safe Workflow

Keep raw files under `private_data/apple_health/`. If you receive `export.zip`,
unzip it locally and locate the XML before running the scripts.

```bash
cd backend
npm run preview:apple-health -- ../private_data/apple_health/export.xml
npm run derive:apple-health -- ../private_data/apple_health/export.xml
```

Then import only the derived daily CSV.

Direct browser XML upload is for development or small files only. GitHub Pages
cannot import XML because it has no backend.

## What Agent May Receive

Allowed:

- elder id / demo profile label
- one daily snapshot
- baseline summary
- recent event summaries
- deterministic risk result

Not allowed:

- raw XML
- full heart-rate time series
- Apple ID
- device owner identity
- clinical records
