import { MockNoticeBanner } from "../components/MockNoticeBanner";
import { StatusPill } from "../components/StatusPill";
import { useDemo } from "../store/demoStore";
import type { ConsentPrivacyRecord } from "../types";

const roles = ["老人", "护工", "家属", "机构", "医生"];
const dataRows = [
  { type: "基础资料", scope: ["已授权", "已授权", "仅摘要可见", "已授权", "未授权"] },
  { type: "初始照护记忆", scope: ["仅摘要可见", "已授权", "仅摘要可见", "已授权", "未授权"] },
  { type: "健康状态数据", scope: ["仅摘要可见", "已授权", "仅摘要可见", "已授权", "未授权"] },
  { type: "用药状态", scope: ["仅摘要可见", "已授权", "仅摘要可见", "已授权", "未授权"] },
  { type: "语音摘要", scope: ["仅摘要可见", "已授权", "仅摘要可见", "仅摘要可见", "未授权"] },
  { type: "位置区域", scope: ["仅区域", "已授权", "仅区域", "仅区域", "未授权"] },
  { type: "原始病历", scope: ["不保存原始资料", "未授权", "未授权", "未授权", "未授权"] },
  { type: "AI 摘要", scope: ["仅摘要可见", "已授权", "仅摘要可见", "已授权", "未授权"] },
];

interface ConsentPrivacyPageProps {
  elderId?: string;
}

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="toggle-row">
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
  </label>
);

export const ConsentPrivacyPage = ({ elderId = "E001" }: ConsentPrivacyPageProps) => {
  const { state, dispatch } = useDemo();
  const profile = state.profiles[elderId] ?? state.profiles.E001;
  const consent = state.consentRecords[profile.elderId];
  const update = (
    field: keyof Omit<ConsentPrivacyRecord, "elderId" | "updatedAt">,
    value: boolean | ConsentPrivacyRecord["rawMedicalRecordRetention"],
  ) => dispatch({ type: "UPDATE_CONSENT", elderId: profile.elderId, field, value });

  return (
    <div className="page docs-page">
      <header className="page-header">
        <div>
          <span>授权与隐私 / Consent & Privacy</span>
          <h1>{profile.name}数据边界</h1>
          <p>展示健康数据、历史资料、语音摘要、位置区域和角色权限如何被限制。</p>
        </div>
      </header>
      <MockNoticeBanner>当前为授权状态模拟，不接真实身份认证或医疗系统。</MockNoticeBanner>
      <section className="panel">
        <div className="section-title">
          <span>角色可见范围表</span>
          <h2>数据类型与权限状态</h2>
        </div>
        <div className="table-wrap">
          <table className="heatmap-table">
            <thead>
              <tr>
                <th>数据类型</th>
                {roles.map((role) => <th key={role}>{role}</th>)}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row) => (
                <tr key={row.type}>
                  <td>{row.type}</td>
                  {row.scope.map((scope, index) => (
                    <td key={`${row.type}-${roles[index]}`}>
                      <StatusPill
                        label={scope}
                        tone={scope === "未授权" ? "muted" : scope.includes("摘要") ? "observation" : "stable"}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="two-column">
        <article className="panel">
          <div className="section-title">
            <span>模拟授权开关</span>
            <h2>当前 consent record</h2>
          </div>
          <div className="toggle-stack">
            <Toggle label="家属可看趋势" checked={consent.familyCanViewTrend} onChange={(value) => update("familyCanViewTrend", value)} />
            <Toggle label="护工可看任务" checked={consent.caregiverCanViewTasks} onChange={(value) => update("caregiverCanViewTasks", value)} />
            <Toggle label="机构可看风险热力图" checked={consent.institutionCanViewRiskHeatmap} onChange={(value) => update("institutionCanViewRiskHeatmap", value)} />
            <Toggle label="医生可看就诊摘要（默认关闭）" checked={consent.doctorCanViewVisitSummary} onChange={(value) => update("doctorCanViewVisitSummary", value)} />
          </div>
        </article>
        <article className="panel">
          <div className="section-title">
            <span>重要声明</span>
            <h2>产品边界</h2>
          </div>
          <ul className="insight-list">
            <li>不做医疗诊断。</li>
            <li>不展示精确位置轨迹，只展示区域和安全区状态。</li>
            <li>原始病历可选择不长期保存；当前设置为不保存原始资料。</li>
            <li>AI 结论必须人工确认。</li>
            <li>数据不足不强行判断。</li>
          </ul>
        </article>
      </section>
    </div>
  );
};
