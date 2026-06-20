import { Router } from "express";
import { insertAgentOutput } from "../db.js";
import { analyzeWithFallback } from "../agent/openaiAgent.js";
import { agentAnalyzeSchema } from "../validators.js";

export const agentRouter = Router();

agentRouter.post("/analyze", async (req, res, next) => {
  try {
    const input = agentAnalyzeSchema.parse(req.body);
    const output = await analyzeWithFallback(input);
    const elderId =
      input.elder_profile.elder_id ??
      input.elder_profile.elderId ??
      input.daily_snapshot.elder_id ??
      input.daily_snapshot.elderId;

    if (!elderId) {
      res.status(400).json({ ok: false, error: "缺少 elder_id。" });
      return;
    }

    const saved = insertAgentOutput({
      elder_id: elderId,
      source_event_id: input.source_event_id ?? null,
      status_level: output.status_level,
      risk_score: output.risk_score,
      caregiver_summary: output.caregiver_summary,
      family_summary: output.family_summary,
      institution_summary: output.institution_summary,
      recommended_action: output.recommended_action,
      safety_disclaimer: output.safety_disclaimer,
      key_reasons: output.key_reasons,
      agent_source: output.agent_source ?? "openai",
      warning: output.warning ?? null,
    });

    res.status(201).json({
      ...output,
      output_id: saved.output_id,
      elder_id: saved.elder_id,
      agent_source: saved.agent_source,
      warning: saved.warning,
      created_at: saved.created_at,
    });
  } catch (error) {
    next(error);
  }
});
