# Apple Health 匯入安全報告

## 匯入來源與隱私確認

- 使用檔案：本機 Apple Health 匯出 zip，解壓後使用 `private_data/apple_health/apple_health_export/` 內的主健康 XML。
- 原始檔保護：`private_data/`、`*.zip`、`export.xml`、`apple_health_export/`、SQLite、`.env`、`uploads/` 均已加入 `.gitignore`。
- 本報告只包含每日聚合後的匿名化摘要，不包含 raw XML、Apple ID、個人 profile、臨床紀錄或原始心率時間序列。
- 匯入對象：`TEST001`，前端標示為「團隊成員 Apple Watch 測試資料 / 非真實長者資料」。
- Agent 分析只使用每日聚合 snapshot、risk_result 與事件摘要，未使用 raw Apple Health XML。

## 匯入方法

- Preview：使用 streaming CLI 讀取大型 XML，避免把約 985 MB XML 一次載入記憶體。
- Derived CSV：已生成 `private_data/derived/apple_watch_daily_snapshots.csv`，只包含 DailySnapshot 聚合欄位。
- DB 匯入：使用 `POST /api/import/daily-snapshots-csv` 匯入最近 14 天資料。
- Snapshot id：Apple Health 匯入資料使用 `APPLE-TEST001-YYYY-MM-DD`，避免重複匯入產生 duplicate latest。

## 匯入摘要

- Preview 偵測天數：1239 天
- Preview 日期範圍：2023-01-26 至 2026-06-19
- 實際匯入天數：14 天
- 實際匯入日期範圍：2026-06-06 至 2026-06-19
- 最新 snapshot：2026-06-19，data_source = Apple Health Export，data_quality = 85
- data_quality 範圍：25 至 100
- 步數範圍：1099 至 35006
- 平均心率範圍：67 至 115.5 bpm
- 靜息心率範圍：58 至 87 bpm
- 睡眠時長範圍：4.25 至 8.54 小時
- 活動分鐘範圍：1 至 39 分鐘

## Warnings

- XML 很大，demo 已使用 streaming parser；正式產品仍建議採 streaming/queue import。
- Apple Health 日期包含 timezone offset；目前依記錄中的本地日曆日分組。
- 同時偵測到 Apple Watch 與 iPhone 來源，步數可能存在重複來源放大的風險。
- 最近 14 天中有 1 天缺少平均心率，6 天缺少 asleep sleep duration。
- 2026-06-10、2026-06-14 步數超過 30000，已標記為需人工確認。
- 2026-06-17 data_quality = 25，低於 40，若作為最新日會被視為 insufficient_data。

## Dashboard QA

- `/api/dashboard` 可看到 `TEST001`。
- `TEST001` latest snapshot 顯示：
  - date = 2026-06-19
  - data_source = Apple Health Export
  - data_quality = 85
  - baseline_label = 7日基線
  - usable_days = 7
- 前端 QA 已確認：
  - 後端已連接
  - 機構端顯示 TEST001 與 Apple Health Export
  - TEST001 詳情頁顯示 snapshot date、data_quality、平均心率、靜息心率、步數、活動分鐘、睡眠、7日基線
  - Agent source 顯示 Mock fallback
  - 顯示免責聲明：本結果僅為照護風險提示，不構成醫療診斷。
- QA 截圖：
  - `output/playwright/apple-health-institution-final.png`
  - `output/playwright/apple-health-test001-final.png`

## Demo Risk Flow

- 事件 1：`voice_symptom`，raw_text = `我有點頭暈`
  - riskEngine 結果：attention，risk_score = 55
- 事件 2：`sos_long_press`
  - riskEngine 結果：high_risk，risk_score = 84
  - task 已建立/升級：priority = high，status = pending
- Agent analyze：
  - agent_source = mock
  - 已返回 caregiver_summary、family_summary、institution_summary
  - 已包含免責聲明：本結果僅為照護風險提示，不構成醫療診斷。

## 測試與建置

- Backend tests：7 passed
- Frontend Vitest：31 passed
- TypeScript build：passed
- Vite build：passed

## 結論

Apple Watch / Apple Health 匯出資料已安全轉換為 CareBand v0.2 的 DailySnapshot 聚合資料，最近 14 天已匯入 `TEST001`，dashboard 與 demo risk flow 均可運作。此資料僅作為團隊成員 Apple Watch 測試資料，不代表真實長者資料，也不構成任何醫療診斷。
