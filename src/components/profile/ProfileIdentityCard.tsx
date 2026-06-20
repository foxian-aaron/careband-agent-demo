import type { DailySnapshot, ElderProfile, ElderProfileDetail, RiskResult } from "../../types";
import type { DisplayStatus } from "../../lib/displayStatus";
import { displayToneToPillTone } from "../../lib/displayStatus";
import { formatDateTime } from "../../lib/dateUtils";
import { riskLabels } from "../../lib/statusLabels";
import { RiskBadge } from "../RiskBadge";
import { StatusPill } from "../StatusPill";

interface ProfileIdentityCardProps {
  profile: ElderProfile;
  detail?: ElderProfileDetail;
  snapshot: DailySnapshot;
  risk: RiskResult;
  displayStatus: DisplayStatus;
}

export const ProfileIdentityCard = ({
  profile,
  detail,
  snapshot,
  risk,
  displayStatus,
}: ProfileIdentityCardProps) => (
  <section className="panel profile-identity">
    <div>
      <span>老人档案</span>
      <h1>{profile.name}</h1>
      <p>
        {profile.age} 岁 · 房间 {profile.room} · {profile.floor} ·{" "}
        {detail?.institutionName ?? "澳门长者中心 Demo"}
      </p>
      <div className="tag-row">
        <StatusPill label={displayStatus.label} tone={displayToneToPillTone(displayStatus.tone)} />
        <StatusPill
          label={`数据完整度 ${Math.round(snapshot.dataCompleteness * 100)}%`}
          tone={snapshot.dataCompleteness < 0.4 ? "muted" : "stable"}
        />
        <StatusPill label={detail?.careGroup ?? "二楼照护组"} tone="observation" />
      </div>
    </div>
    <div className="hero-status-stack">
      <RiskBadge level={risk.riskLevel} score={risk.riskScore} />
      <span>今日风险等级：{riskLabels[risk.riskLevel]}</span>
      <small>最近同步 {formatDateTime(snapshot.lastSyncedAt)}</small>
    </div>
  </section>
);
