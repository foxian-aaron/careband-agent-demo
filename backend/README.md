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
CORS_ORIGIN=http://localhost:5173
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

CSV 是推荐 demo 路径；XML 解析适用于小到中等导出文件。真实商业化场景需要流式解析、用户授权和数据治理，本 demo 不实现这些能力。
