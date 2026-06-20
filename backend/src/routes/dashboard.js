import { Router } from "express";
import {
  getBaseline,
  getEventsForElder,
  getLatestAgentOutput,
  getLatestSnapshot,
  getTasksForElder,
  listElders,
} from "../db.js";
import { evaluateRisk } from "../rules/riskEngine.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", (_req, res) => {
  const elders = listElders().map((elder) => {
    const snapshot = getLatestSnapshot(elder.elder_id);
    const baseline = getBaseline(elder.elder_id);
    const events = getEventsForElder(elder.elder_id);
    const riskResult = snapshot
      ? evaluateRisk({ elder, snapshot, baseline, events })
      : null;

    return {
      elder,
      baseline,
      latest_snapshot: snapshot,
      events,
      risk_result: riskResult,
      tasks: getTasksForElder(elder.elder_id),
      latest_agent_output: getLatestAgentOutput(elder.elder_id),
    };
  });

  res.json({
    ok: true,
    generated_at: new Date().toISOString(),
    elders,
  });
});
