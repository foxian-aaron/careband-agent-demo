import { useMemo, useState } from "react";
import { InstitutionHeatmap, type HeatmapRow } from "../components/InstitutionHeatmap";
import { MedicalDisclaimer } from "../components/MedicalDisclaimer";
import { RiskBadge } from "../components/RiskBadge";
import { getRiskForElder, getTaskForElder, useDemo } from "../store/demoStore";
import type { RiskLevel } from "../types";
import { riskLabels, riskOrder } from "../lib/statusLabels";

type FilterValue = "all" | RiskLevel;

const filters: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "全部" },
  { value: "high_risk", label: "高风险" },
  { value: "attention", label: "需关注" },
  { value: "observation", label: "观察" },
  { value: "stable", label: "稳定" },
  { value: "data_insufficient", label: "数据不足" },
];

export const InstitutionPage = () => {
  const { state } = useDemo();
  const [filter, setFilter] = useState<FilterValue>("all");

  const rows = useMemo<HeatmapRow[]>(() => {
    return Object.values(state.profiles)
      .map((profile) => ({
        profile,
        risk: getRiskForElder(state, profile.elderId),
        task: getTaskForElder(state, profile.elderId),
        operationalState: state.operationalStates[profile.elderId] ?? "normal",
      }))
      .sort((a, b) => riskOrder[b.risk.riskLevel] - riskOrder[a.risk.riskLevel]);
  }, [state]);

  const filteredRows =
    filter === "all" ? rows : rows.filter((row) => row.risk.riskLevel === filter);
  const highRiskCount = rows.filter((row) =>
    ["high_risk", "urgent"].includes(row.risk.riskLevel),
  ).length;
  const attentionCount = rows.filter((row) => row.risk.riskLevel === "attention").length;
  const stableCount = rows.filter((row) => row.risk.riskLevel === "stable").length;
  const pendingTaskCount = state.tasks.filter((task) => task.status !== "completed").length;
  const avgCompleteness = Math.round(
    (rows.reduce((sum, row) => sum + row.risk.dataCompleteness, 0) / rows.length) * 100,
  );
  const medicationUnconfirmed = Object.values(state.snapshots).filter(
    (snapshot) => snapshot.medicationEvening === "not_confirmed",
  ).length;
  const activityDrop = rows.filter(
    (row) => row.risk.dimensions.activity === "significantly_low",
  ).length;
  const sleepLow = rows.filter((row) => row.risk.dimensions.sleep === "below_baseline").length;
  const dataInsufficient = rows.filter(
    (row) => row.risk.riskLevel === "data_insufficient",
  ).length;
  const institutionSummary = `今天共有 ${highRiskCount} 位长者处于高风险或紧急状态，${attentionCount} 位需要关注，${pendingTaskCount} 个任务仍需处理。建议机构优先安排护工查看高风险与晚药未确认长者，同时先确认数据不足长者的设备佩戴和同步情况。`;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span>机构端</span>
          <h1>长者风险热力图</h1>
          <p>面向管理者的群体态势、任务状态和巡查优先级总览。</p>
        </div>
        <a className="primary-link" href="#/demo-control">
          进入 Demo 控制台
        </a>
      </header>

      <section className="stats-grid">
        <article><span>高风险人数</span><strong>{highRiskCount}</strong></article>
        <article><span>需关注人数</span><strong>{attentionCount}</strong></article>
        <article><span>稳定人数</span><strong>{stableCount}</strong></article>
        <article><span>待处理任务数</span><strong>{pendingTaskCount}</strong></article>
        <article><span>平均数据完整度</span><strong>{avgCompleteness}%</strong></article>
      </section>

      <section className="panel">
        <div className="section-title with-actions">
          <div>
            <span>机构风险热力图</span>
            <h2>按风险等级排序</h2>
          </div>
          <div className="filter-row">
            {filters.map((item) => (
              <button
                className={filter === item.value ? "active" : ""}
                key={item.value}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <InstitutionHeatmap rows={filteredRows} />
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="section-title">
            <span>群体趋势摘要</span>
            <h2>今日关注点</h2>
          </div>
          <div className="summary-grid">
            <div><span>今日高风险事件数</span><strong>{highRiskCount}</strong></div>
            <div><span>用药未确认人数</span><strong>{medicationUnconfirmed}</strong></div>
            <div><span>活动明显下降人数</span><strong>{activityDrop}</strong></div>
            <div><span>睡眠偏低人数</span><strong>{sleepLow}</strong></div>
            <div><span>数据不足人数</span><strong>{dataInsufficient}</strong></div>
          </div>
        </article>
        <article className="panel ai-summary-card">
          <div className="section-title">
            <span>Mock AI 机构摘要</span>
            <h2>今日管理建议</h2>
          </div>
          <p>{institutionSummary}</p>
          <div className="risk-strip">
            {rows.slice(0, 3).map((row) => (
              <div key={row.profile.elderId}>
                <strong>{row.profile.name}</strong>
                <RiskBadge level={row.risk.riskLevel} />
                <span>{riskLabels[row.risk.riskLevel]}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
      <MedicalDisclaimer />
    </div>
  );
};
