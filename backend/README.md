# CareBand Agent Backend v0.2

最小 demo backend，负责 SQLite 存储、风险规则、导入 Apple Health 派生数据和 AI Agent 摘要。

## 启动

```bash
npm install
npm run dev
```

默认端口：`3001`。

## 环境变量

复制 `.env.example` 为 `.env`：

```env
PORT=3001
DATABASE_PATH=./data/careband.sqlite
USE_MOCK_AGENT=true
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
AGENT_TIMEOUT_MS=30000
CORS_ORIGIN=http://localhost:5173
APPLE_HEALTH_STEP_SOURCE_STRATEGY=prefer_watch
APPLE_HEALTH_XML_UPLOAD_MAX_MB=150
```

无 `OPENAI_API_KEY` 或 `USE_MOCK_AGENT=true` 时自动使用 mock Agent。

## 数据表

- `elders`
- `snapshots`
- `events`
- `tasks`
- `agent_outputs`

SQLite 文件位于 `backend/data/careband.sqlite`，已被 ignore。

## API

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

## 风险规则

后端先运行 deterministic riskEngine，再交给 Agent 解释：

- `data_quality < 40` → `insufficient_data`
- `sos_long_press` → `high_risk`
- `fall_detected` → `urgent`
- 文本包含 `头晕 / 胸闷 / 跌倒 / 不舒服` → 至少 `attention`
- 用药未确认 + `头晕` → `high_risk`
- 步数低于基线 50% 且睡眠低于基线 25% → `attention`
- 单项轻度异常 → `observe`
- 否则 `stable`

硬事件会优先于数据不足，避免 SOS / 跌倒被低数据质量掩盖。

## Apple Health

真实数据推荐路径：

```bash
npm run preview:apple-health -- ../private_data/apple_health/export.xml
npm run derive:apple-health -- ../private_data/apple_health/export.xml
```

然后导入 `private_data/derived/apple_watch_daily_snapshots.csv`。

Direct XML upload 只适合开发或小文件，会写入 `backend/uploads/` 临时文件并在完成后删除；如果 XML 过大，会返回清楚错误，要求改用本地 preview/derive -> CSV 流程。

GitHub Pages 无法运行本后端，也无法导入 XML/CSV。公网页面的 `/v0.2/` 版本只是静态预览，使用 safe mock fallback。

默认步数策略是 `prefer_watch`：同一天同时存在 Apple Watch 和 iPhone 步数时，优先使用 Apple Watch，避免默认双重计步。

## Agent Boundary

目前 provider 是 mock fallback / OpenAI。未来可在 `/api/agent/analyze` 后端实现替换为 QwenPaw-compatible endpoint，但 v0.2 不宣称 QwenPaw 已完整集成。
