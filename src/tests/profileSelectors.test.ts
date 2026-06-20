import { describe, expect, it } from "vitest";
import {
  getConsentStatusForElder,
  getProfileSummaryForElder,
} from "../lib/profileSelectors";
import { createInitialDemoState } from "../store/demoStore";

describe("profileSelectors", () => {
  it("returns Chen profile summary with care team", () => {
    const state = createInitialDemoState();
    const summary = getProfileSummaryForElder("E001", state);

    expect(summary.name).toBe("陈伯");
    expect(summary.room).toBe("203");
    expect(summary.chronicConditions).toContain("高血压");
    expect(summary.riskTags).toContain("用药需提醒");
    expect(summary.primaryCaregiverName).toBe("护工A");
    expect(summary.familyContactName).toBe("陈先生");
  });

  it("returns Chen consent settings", () => {
    const state = createInitialDemoState();
    const consent = getConsentStatusForElder("E001", state);

    expect(consent?.familyCanViewMedicationStatus).toBe(true);
    expect(consent?.locationPrecision).toBe("zone_only");
    expect(consent?.voiceRawTextPolicy).toBe("summary_only");
  });
});
