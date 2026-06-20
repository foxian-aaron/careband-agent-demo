import { Router } from "express";
import {
  createTaskForRisk,
  getBaseline,
  getElder,
  getEventsForElder,
  getLatestSnapshot,
  insertEvent,
} from "../db.js";
import { evaluateRisk } from "../rules/riskEngine.js";
import { eventSchema } from "../validators.js";

export const eventsRouter = Router();

eventsRouter.post("/", (req, res, next) => {
  try {
    const eventInput = eventSchema.parse(req.body);
    const elder = getElder(eventInput.elder_id);
    if (!elder) {
      res.status(404).json({ ok: false, error: `找不到 elder_id=${eventInput.elder_id}` });
      return;
    }

    const event = insertEvent(eventInput);
    const snapshot = getLatestSnapshot(event.elder_id);
    if (!snapshot) {
      res.status(409).json({
        ok: false,
        error: "该长者尚无 DailySnapshot，无法运行风险规则。",
        event,
      });
      return;
    }

    const baseline = getBaseline(event.elder_id);
    const events = getEventsForElder(event.elder_id);
    const riskResult = evaluateRisk({ elder, snapshot, baseline, events });
    const task = createTaskForRisk({ elder, event, riskResult });

    res.status(201).json({
      ok: true,
      event,
      risk_result: riskResult,
      task,
    });
  } catch (error) {
    next(error);
  }
});
