import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { SAFETY_DISCLAIMER } from "./constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

const resolveDatabasePath = () => {
  const configured = process.env.DATABASE_PATH;
  if (!configured) return path.join(backendRoot, "data", "careband.sqlite");
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(backendRoot, configured);
};

export const DEMO_BASELINES = {
  E001: {
    elder_id: "E001",
    avg_steps_7d: 2150,
    avg_sleep_7d: 6.5,
    avg_active_minutes_7d: 46,
    resting_hr_baseline: 72,
    baseline_confidence: 91,
  },
  E002: {
    elder_id: "E002",
    avg_steps_7d: 1680,
    avg_sleep_7d: 6.2,
    avg_active_minutes_7d: 38,
    resting_hr_baseline: 76,
    baseline_confidence: 88,
  },
  E003: {
    elder_id: "E003",
    avg_steps_7d: 2450,
    avg_sleep_7d: 6.9,
    avg_active_minutes_7d: 58,
    resting_hr_baseline: 70,
    baseline_confidence: 86,
  },
  E004: {
    elder_id: "E004",
    avg_steps_7d: 1900,
    avg_sleep_7d: 7.1,
    avg_active_minutes_7d: 42,
    resting_hr_baseline: 68,
    baseline_confidence: 94,
  },
  TEST001: {
    elder_id: "TEST001",
    avg_steps_7d: 1800,
    avg_sleep_7d: 6.5,
    avg_active_minutes_7d: 40,
    resting_hr_baseline: 72,
    baseline_confidence: 20,
    baseline_label: "基線建立中",
    usable_days: 0,
  },
};

let connection;

export const nowIso = () => new Date().toISOString();

export const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const stringifyJson = (value) => JSON.stringify(value ?? {});

export function getDb() {
  if (connection) return connection;

  const dbPath = resolveDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  connection = new Database(dbPath);
  connection.pragma("journal_mode = WAL");
  connection.pragma("foreign_keys = ON");

  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  connection.exec(schema);
  seedDemoData(connection);

  return connection;
}

function seedDemoData(db) {
  const count = db.prepare("SELECT COUNT(*) AS count FROM elders").get().count;
  if (count > 0) {
    ensureTestElder(db);
    return;
  }

  const createdAt = "2026-06-19T08:00:00+08:00";
  const elders = [
    {
      elder_id: "E001",
      name: "陈伯",
      age: 78,
      room: "203",
      risk_tags: ["轻度跌倒风险", "用药需提醒", "活动下降"],
    },
    {
      elder_id: "E002",
      name: "李婆婆",
      age: 82,
      room: "205",
      risk_tags: ["夜间离床关注", "睡眠偏低"],
    },
    {
      elder_id: "E003",
      name: "黄叔",
      age: 76,
      room: "201",
      risk_tags: ["活动趋势观察", "冠心病史"],
    },
    {
      elder_id: "E004",
      name: "梁婆婆",
      age: 74,
      room: "206",
      risk_tags: ["常规观察"],
    },
  ];

  const snapshots = [
    {
      snapshot_id: "SNAP-E001-SEED",
      elder_id: "E001",
      date: "2026-06-19",
      data_source: "Demo Seed",
      heart_rate_avg: 86,
      resting_heart_rate: 72,
      steps: 820,
      active_minutes: 18,
      sleep_duration: 4.8,
      wear_time_hours: 18.5,
      data_quality: 82,
      created_at: "2026-06-19T07:05:00+08:00",
    },
    {
      snapshot_id: "SNAP-E002-SEED",
      elder_id: "E002",
      date: "2026-06-19",
      data_source: "Demo Seed",
      heart_rate_avg: 82,
      resting_heart_rate: 76,
      steps: 1180,
      active_minutes: 25,
      sleep_duration: 4.4,
      wear_time_hours: 19.2,
      data_quality: 87,
      created_at: "2026-06-19T07:02:00+08:00",
    },
    {
      snapshot_id: "SNAP-E003-SEED",
      elder_id: "E003",
      date: "2026-06-19",
      data_source: "Demo Seed",
      heart_rate_avg: 75,
      resting_heart_rate: 70,
      steps: 1050,
      active_minutes: 30,
      sleep_duration: 6.4,
      wear_time_hours: 17.8,
      data_quality: 80,
      created_at: "2026-06-19T06:58:00+08:00",
    },
    {
      snapshot_id: "SNAP-E004-SEED",
      elder_id: "E004",
      date: "2026-06-19",
      data_source: "Demo Seed",
      heart_rate_avg: 69,
      resting_heart_rate: 68,
      steps: 1840,
      active_minutes: 41,
      sleep_duration: 7,
      wear_time_hours: 20.1,
      data_quality: 93,
      created_at: "2026-06-19T07:04:00+08:00",
    },
  ];

  const events = [
    {
      event_id: "EVT-E001-ACTIVITY-LOW",
      elder_id: "E001",
      event_type: "low_activity",
      timestamp: "2026-06-19T12:30:00+08:00",
      source: "system",
      raw_text: "活动量明显低于本人近期基线",
      payload: { activity_drop_percent: 62 },
      created_at: "2026-06-19T12:30:00+08:00",
    },
    {
      event_id: "EVT-E001-MED-PM-REMINDER",
      elder_id: "E001",
      event_type: "medication_reminder",
      timestamp: "2026-06-19T20:00:00+08:00",
      source: "system",
      raw_text: "晚药提醒，暂未确认",
      payload: { medication_confirmed: false },
      created_at: "2026-06-19T20:00:00+08:00",
    },
    {
      event_id: "EVT-E002-NIGHT-AWAY",
      elder_id: "E002",
      event_type: "night_wakeup",
      timestamp: "2026-06-19T03:20:00+08:00",
      source: "mock_wearable",
      raw_text: "夜间离床次数增加",
      payload: { night_wakeup_count: 4 },
      created_at: "2026-06-19T03:20:00+08:00",
    },
    {
      event_id: "EVT-E003-ACTIVITY-TREND",
      elder_id: "E003",
      event_type: "low_activity",
      timestamp: "2026-06-19T17:40:00+08:00",
      source: "system",
      raw_text: "活动量连续两天下降",
      payload: { activity_drop_percent: 57 },
      created_at: "2026-06-19T17:40:00+08:00",
    },
    {
      event_id: "EVT-E004-STABLE",
      elder_id: "E004",
      event_type: "system_risk_update",
      timestamp: "2026-06-19T18:10:00+08:00",
      source: "system",
      raw_text: "今日状态接近个人基线",
      payload: {},
      created_at: "2026-06-19T18:10:00+08:00",
    },
  ];

  const tasks = [
    {
      task_id: "TASK-E002-SLEEP",
      elder_id: "E002",
      source_event_id: "EVT-E002-NIGHT-AWAY",
      priority: "medium",
      task_title: "李婆婆睡眠与夜间离床需关注",
      task_reason: "睡眠偏低 + 夜间离床次数增加",
      recommended_action: "请护工晚间巡查时确认休息情况，必要时提醒减少夜间走动风险。",
      status: "in_progress",
      handled_by: "护工A",
      handled_note: null,
      created_at: "2026-06-19T08:10:00+08:00",
      completed_at: null,
    },
  ];

  const agentOutputs = elders.map((elder) => {
    const status = elder.elder_id === "E004" ? "stable" : "attention";
    return {
      output_id: `AGENT-${elder.elder_id}-SEED`,
      elder_id: elder.elder_id,
      source_event_id: null,
      status_level: status,
      risk_score: status === "stable" ? 16 : 52,
      caregiver_summary:
        status === "stable"
          ? `${elder.name}今日指标接近个人基线，保持常规照护。`
          : `${elder.name}今日有一项以上指标偏离个人基线，建议护工在巡查中确认状态。`,
      family_summary:
        status === "stable"
          ? `${elder.name}今日状态平稳，中心会继续常规观察。`
          : `${elder.name}今日有需要关注的变化，照护人员会继续跟进。`,
      institution_summary:
        status === "stable"
          ? `${elder.name}可维持常规观察。`
          : `${elder.name}建议纳入今日巡查关注列表。`,
      recommended_action:
        status === "stable"
          ? "保持常规照护与日常观察。"
          : "请护工结合现场情况复核活动、睡眠和用药状态。",
      safety_disclaimer: SAFETY_DISCLAIMER,
      key_reasons: stringifyJson(
        status === "stable" ? ["今日状态接近个人基线"] : ["存在照护风险提示项"],
      ),
      agent_source: "mock",
      warning: null,
      created_at: "2026-06-19T20:10:00+08:00",
    };
  });

  const insertElder = db.prepare(
    `INSERT INTO elders (elder_id, name, age, room, risk_tags, created_at)
     VALUES (@elder_id, @name, @age, @room, @risk_tags, @created_at)`,
  );
  const insertSnapshot = db.prepare(
    `INSERT INTO snapshots (
      snapshot_id, elder_id, date, data_source, heart_rate_avg,
      resting_heart_rate, steps, active_minutes, sleep_duration,
      wear_time_hours, data_quality, created_at
    ) VALUES (
      @snapshot_id, @elder_id, @date, @data_source, @heart_rate_avg,
      @resting_heart_rate, @steps, @active_minutes, @sleep_duration,
      @wear_time_hours, @data_quality, @created_at
    )`,
  );
  const insertEvent = db.prepare(
    `INSERT INTO events (
      event_id, elder_id, event_type, timestamp, source, raw_text, payload, created_at
    ) VALUES (
      @event_id, @elder_id, @event_type, @timestamp, @source, @raw_text, @payload, @created_at
    )`,
  );
  const insertTask = db.prepare(
    `INSERT INTO tasks (
      task_id, elder_id, source_event_id, priority, task_title, task_reason,
      recommended_action, status, handled_by, handled_note, created_at, completed_at
    ) VALUES (
      @task_id, @elder_id, @source_event_id, @priority, @task_title, @task_reason,
      @recommended_action, @status, @handled_by, @handled_note, @created_at, @completed_at
    )`,
  );
  const insertAgentOutput = db.prepare(
    `INSERT INTO agent_outputs (
      output_id, elder_id, source_event_id, status_level, risk_score,
      caregiver_summary, family_summary, institution_summary, recommended_action,
      safety_disclaimer, key_reasons, agent_source, warning, created_at
    ) VALUES (
      @output_id, @elder_id, @source_event_id, @status_level, @risk_score,
      @caregiver_summary, @family_summary, @institution_summary, @recommended_action,
      @safety_disclaimer, @key_reasons, @agent_source, @warning, @created_at
    )`,
  );

  const seed = db.transaction(() => {
    for (const elder of elders) {
      insertElder.run({
        ...elder,
        risk_tags: stringifyJson(elder.risk_tags),
        created_at: createdAt,
      });
    }
    for (const snapshot of snapshots) insertSnapshot.run(snapshot);
    for (const event of events) {
      insertEvent.run({ ...event, payload: stringifyJson(event.payload) });
    }
    for (const task of tasks) insertTask.run(task);
    for (const output of agentOutputs) insertAgentOutput.run(output);
  });

  seed();
  ensureTestElder(db);
}

function ensureTestElder(db) {
  const exists = db.prepare("SELECT elder_id FROM elders WHERE elder_id = ?").get("TEST001");
  if (exists) return;

  db.prepare(
    `INSERT INTO elders (elder_id, name, age, room, risk_tags, created_at)
     VALUES (@elder_id, @name, @age, @room, @risk_tags, @created_at)`,
  ).run({
    elder_id: "TEST001",
    name: "團隊測試資料",
    age: 30,
    room: "TEST",
    risk_tags: stringifyJson(["團隊成員 Apple Watch 測試資料", "非真實長者資料"]),
    created_at: nowIso(),
  });
}

const averageField = (rows, field, fallback) => {
  const values = rows
    .map((row) => row[field])
    .filter((value) => typeof value === "number" && Number.isFinite(value));
  if (!values.length) return fallback;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
};

function getAppleTestBaseline(elderId) {
  const rows = getDb()
    .prepare(
      `SELECT * FROM snapshots
       WHERE elder_id = ? AND data_quality >= 40
       ORDER BY date DESC, created_at DESC
       LIMIT 7`,
    )
    .all(elderId);
  const fallback = DEMO_BASELINES.TEST001;
  const enoughDays = rows.length >= 3;

  return {
    elder_id: elderId,
    avg_steps_7d: averageField(rows, "steps", fallback.avg_steps_7d),
    avg_sleep_7d: averageField(rows, "sleep_duration", fallback.avg_sleep_7d),
    avg_active_minutes_7d: averageField(rows, "active_minutes", fallback.avg_active_minutes_7d),
    resting_hr_baseline: averageField(rows, "resting_heart_rate", fallback.resting_hr_baseline),
    baseline_confidence: enoughDays ? Math.min(95, 50 + rows.length * 6) : Math.max(20, rows.length * 12),
    baseline_label: enoughDays ? "7日基線" : "基線建立中",
    usable_days: rows.length,
  };
}

export function getBaseline(elderId) {
  if (elderId === "TEST001") return getAppleTestBaseline(elderId);
  return DEMO_BASELINES[elderId] ?? {
    elder_id: elderId,
    avg_steps_7d: 1800,
    avg_sleep_7d: 6.5,
    avg_active_minutes_7d: 40,
    resting_hr_baseline: 72,
    baseline_confidence: 70,
  };
}

export function mapElder(row) {
  if (!row) return null;
  return {
    ...row,
    risk_tags: parseJson(row.risk_tags, []),
  };
}

export function mapSnapshot(row) {
  return row ?? null;
}

export function mapEvent(row) {
  if (!row) return null;
  return {
    ...row,
    payload: parseJson(row.payload, {}),
  };
}

export function mapTask(row) {
  return row ?? null;
}

export function mapAgentOutput(row) {
  if (!row) return null;
  return {
    ...row,
    key_reasons: parseJson(row.key_reasons, []),
  };
}

export function listElders() {
  return getDb()
    .prepare("SELECT * FROM elders ORDER BY elder_id")
    .all()
    .map(mapElder);
}

export function getElder(elderId) {
  return mapElder(getDb().prepare("SELECT * FROM elders WHERE elder_id = ?").get(elderId));
}

export function getLatestSnapshot(elderId) {
  return mapSnapshot(
    getDb()
      .prepare(
        `SELECT * FROM snapshots
         WHERE elder_id = ?
         ORDER BY date DESC, created_at DESC
         LIMIT 1`,
      )
      .get(elderId),
  );
}

export function getEventsForElder(elderId) {
  return getDb()
    .prepare("SELECT * FROM events WHERE elder_id = ? ORDER BY timestamp ASC")
    .all(elderId)
    .map(mapEvent);
}

export function getOpenTasksForElder(elderId) {
  return getDb()
    .prepare(
      `SELECT * FROM tasks
       WHERE elder_id = ? AND status != 'completed'
       ORDER BY created_at DESC`,
    )
    .all(elderId)
    .map(mapTask);
}

export function getTasksForElder(elderId) {
  return getDb()
    .prepare("SELECT * FROM tasks WHERE elder_id = ? ORDER BY created_at DESC")
    .all(elderId)
    .map(mapTask);
}

export function getLatestAgentOutput(elderId) {
  return mapAgentOutput(
    getDb()
      .prepare(
        `SELECT * FROM agent_outputs
         WHERE elder_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      .get(elderId),
  );
}

export function insertSnapshot(snapshot) {
  const db = getDb();
  const record = {
    snapshot_id: snapshot.snapshot_id ?? randomUUID(),
    created_at: snapshot.created_at ?? nowIso(),
    ...snapshot,
  };

  db.prepare(
    `INSERT OR REPLACE INTO snapshots (
      snapshot_id, elder_id, date, data_source, heart_rate_avg,
      resting_heart_rate, steps, active_minutes, sleep_duration,
      wear_time_hours, data_quality, created_at
    ) VALUES (
      @snapshot_id, @elder_id, @date, @data_source, @heart_rate_avg,
      @resting_heart_rate, @steps, @active_minutes, @sleep_duration,
      @wear_time_hours, @data_quality, @created_at
    )`,
  ).run(record);

  return mapSnapshot(
    db.prepare("SELECT * FROM snapshots WHERE snapshot_id = ?").get(record.snapshot_id),
  );
}

export function insertEvent(event) {
  const db = getDb();
  const record = {
    ...event,
    event_id: event.event_id ?? randomUUID(),
    timestamp: event.timestamp ?? nowIso(),
    created_at: event.created_at ?? nowIso(),
    raw_text: event.raw_text ?? null,
    payload: stringifyJson(event.payload ?? {}),
  };

  db.prepare(
    `INSERT OR REPLACE INTO events (
      event_id, elder_id, event_type, timestamp, source, raw_text, payload, created_at
    ) VALUES (
      @event_id, @elder_id, @event_type, @timestamp, @source, @raw_text, @payload, @created_at
    )`,
  ).run(record);

  return mapEvent(db.prepare("SELECT * FROM events WHERE event_id = ?").get(record.event_id));
}

export function createTaskForRisk({ elder, event, riskResult }) {
  const actionable = ["attention", "high_risk", "urgent"].includes(riskResult.status_level);
  if (!actionable) return null;

  const db = getDb();
  const existing = db
    .prepare(
      `SELECT * FROM tasks
       WHERE elder_id = ? AND status != 'completed'
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .get(elder.elder_id);

  if (existing) {
    const nextPriority =
      riskResult.status_level === "urgent"
        ? "urgent"
        : riskResult.status_level === "high_risk"
          ? "high"
          : "medium";
    const priorityRank = { low: 1, medium: 2, high: 3, urgent: 4 };

    if ((priorityRank[nextPriority] ?? 0) > (priorityRank[existing.priority] ?? 0)) {
      const nextTitle =
        riskResult.status_level === "urgent"
          ? `${elder.name} 出現緊急照護事件`
          : riskResult.status_level === "high_risk"
            ? `${elder.name} 需要立即查看`
            : `${elder.name} 需要照護關注`;
      const nextReason = riskResult.key_reasons.join("；") || "規則引擎提示需要關注";

      db.prepare(
        `UPDATE tasks
         SET source_event_id = ?, priority = ?, task_title = ?, task_reason = ?,
             recommended_action = ?
         WHERE task_id = ?`,
      ).run(
        event?.event_id ?? existing.source_event_id,
        nextPriority,
        nextTitle,
        nextReason,
        riskResult.recommended_action,
        existing.task_id,
      );
      return mapTask(db.prepare("SELECT * FROM tasks WHERE task_id = ?").get(existing.task_id));
    }

    return mapTask(existing);
  }

  const priority =
    riskResult.status_level === "urgent"
      ? "urgent"
      : riskResult.status_level === "high_risk"
        ? "high"
        : "medium";
  const title =
    riskResult.status_level === "urgent"
      ? `${elder.name}出现紧急照护事件`
      : riskResult.status_level === "high_risk"
        ? `${elder.name}需要立即查看`
        : `${elder.name}需要照护关注`;

  const record = {
    task_id: randomUUID(),
    elder_id: elder.elder_id,
    source_event_id: event?.event_id ?? null,
    priority,
    task_title: title,
    task_reason: riskResult.key_reasons.join("；") || "规则引擎提示需要关注",
    recommended_action: riskResult.recommended_action,
    status: "pending",
    handled_by: null,
    handled_note: null,
    created_at: nowIso(),
    completed_at: null,
  };

  db.prepare(
    `INSERT INTO tasks (
      task_id, elder_id, source_event_id, priority, task_title, task_reason,
      recommended_action, status, handled_by, handled_note, created_at, completed_at
    ) VALUES (
      @task_id, @elder_id, @source_event_id, @priority, @task_title, @task_reason,
      @recommended_action, @status, @handled_by, @handled_note, @created_at, @completed_at
    )`,
  ).run(record);

  return mapTask(db.prepare("SELECT * FROM tasks WHERE task_id = ?").get(record.task_id));
}

export function updateTask(taskId, changes) {
  const db = getDb();
  const current = db.prepare("SELECT * FROM tasks WHERE task_id = ?").get(taskId);
  if (!current) return null;

  const next = {
    task_id: taskId,
    status: changes.status ?? current.status,
    handled_by: changes.handled_by ?? current.handled_by,
    handled_note: changes.handled_note ?? current.handled_note,
    completed_at:
      changes.completed_at ??
      (changes.status === "completed" && !current.completed_at ? nowIso() : current.completed_at),
  };

  db.prepare(
    `UPDATE tasks
     SET status = @status,
         handled_by = @handled_by,
         handled_note = @handled_note,
         completed_at = @completed_at
     WHERE task_id = @task_id`,
  ).run(next);

  return mapTask(db.prepare("SELECT * FROM tasks WHERE task_id = ?").get(taskId));
}

export function insertAgentOutput(output) {
  const db = getDb();
  const record = {
    ...output,
    output_id: output.output_id ?? randomUUID(),
    source_event_id: output.source_event_id ?? null,
    safety_disclaimer: output.safety_disclaimer ?? SAFETY_DISCLAIMER,
    key_reasons: stringifyJson(output.key_reasons ?? []),
    agent_source: output.agent_source ?? "mock",
    warning: output.warning ?? null,
    created_at: output.created_at ?? nowIso(),
  };

  db.prepare(
    `INSERT INTO agent_outputs (
      output_id, elder_id, source_event_id, status_level, risk_score,
      caregiver_summary, family_summary, institution_summary, recommended_action,
      safety_disclaimer, key_reasons, agent_source, warning, created_at
    ) VALUES (
      @output_id, @elder_id, @source_event_id, @status_level, @risk_score,
      @caregiver_summary, @family_summary, @institution_summary, @recommended_action,
      @safety_disclaimer, @key_reasons, @agent_source, @warning, @created_at
    )`,
  ).run(record);

  return mapAgentOutput(
    db.prepare("SELECT * FROM agent_outputs WHERE output_id = ?").get(record.output_id),
  );
}
