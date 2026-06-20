import OpenAI from "openai";
import { z } from "zod";
import { SAFETY_DISCLAIMER } from "../constants.js";
import { runMockAgent } from "./mockAgent.js";

export const agentOutputSchema = z.object({
  status_level: z.enum([
    "stable",
    "observe",
    "attention",
    "high_risk",
    "urgent",
    "insufficient_data",
  ]),
  risk_score: z.number().min(0).max(100),
  key_reasons: z.array(z.string()),
  caregiver_summary: z.string(),
  family_summary: z.string(),
  institution_summary: z.string(),
  recommended_action: z.string(),
  safety_disclaimer: z.literal(SAFETY_DISCLAIMER),
});

const responseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status_level: {
      type: "string",
      enum: ["stable", "observe", "attention", "high_risk", "urgent", "insufficient_data"],
    },
    risk_score: { type: "number" },
    key_reasons: { type: "array", items: { type: "string" } },
    caregiver_summary: { type: "string" },
    family_summary: { type: "string" },
    institution_summary: { type: "string" },
    recommended_action: { type: "string" },
    safety_disclaimer: { type: "string", enum: [SAFETY_DISCLAIMER] },
  },
  required: [
    "status_level",
    "risk_score",
    "key_reasons",
    "caregiver_summary",
    "family_summary",
    "institution_summary",
    "recommended_action",
    "safety_disclaimer",
  ],
};

const agentTimeoutMs = () => {
  const configured = Number(process.env.AGENT_TIMEOUT_MS ?? 30000);
  return Number.isFinite(configured) && configured > 0 ? configured : 30000;
};

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Agent request timed out after ${timeoutMs}ms`)), timeoutMs),
    ),
  ]);

const buildPromptInput = (input) =>
  JSON.stringify(
    {
      elder_profile: input.elder_profile,
      daily_snapshot: input.daily_snapshot,
      baseline: input.baseline,
      events: input.events,
      risk_result: input.risk_result,
      hard_safety_rule:
        "Explain care-risk signals only. Do not invent a medical diagnosis, disease, prescription, or clinical conclusion.",
    },
    null,
    2,
  );

async function runOpenAiAgent(input) {
  const timeout = agentTimeoutMs();
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await withTimeout(
    client.responses.create({
      model,
      instructions:
        "You are an elderly-care AI Agent for a demo. Generate concise, actionable, non-diagnostic caregiver, family, and institution summaries from the deterministic risk result and daily aggregate data. Return only JSON matching the schema.",
      input: buildPromptInput(input),
      text: {
        format: {
          type: "json_schema",
          name: "careband_agent_output",
          strict: true,
          schema: responseJsonSchema,
        },
      },
    }),
    timeout,
  );

  const text = response.output_text;
  if (!text) throw new Error("OpenAI response did not include output_text.");

  const parsed = JSON.parse(text);
  return agentOutputSchema.parse({
    ...parsed,
    safety_disclaimer: SAFETY_DISCLAIMER,
  });
}

export async function analyzeWithFallback(input) {
  if (!process.env.OPENAI_API_KEY || process.env.USE_MOCK_AGENT === "true") {
    return runMockAgent(input);
  }

  try {
    return {
      ...(await runOpenAiAgent(input)),
      agent_source: "openai",
    };
  } catch (error) {
    return {
      ...runMockAgent(input),
      warning: `OpenAI call failed; mock Agent fallback used: ${error.message}`,
    };
  }
}
