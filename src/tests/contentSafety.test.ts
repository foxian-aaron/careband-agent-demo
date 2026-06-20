import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = [
  "README.md",
  "docs/demo_script_chenbo.md",
  "docs/demo_script_test001_apple_watch.md",
  "docs/v0.1.3_demo_script.md",
  "docs/agent_architecture.md",
  "docs/data-dictionary.md",
  "docs/event-flow.md",
  "docs/risk-rules.md",
  "src/data/mockMedicationPlans.ts",
  "src/data/mockContacts.ts",
  "src/data/mockConsent.ts",
  "src/data/mockProfileDetails.ts",
  "src/lib/medicationSelectors.ts",
  "src/lib/profileSelectors.ts",
  "src/pages/ElderProfilePage.tsx",
  "src/pages/MedicationPage.tsx",
];

const readProjectFile = (file: string) =>
  readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");

describe("content safety for CareBand demo docs", () => {
  it("does not add disallowed hardware wording", () => {
    const content = files.map(readProjectFile).join("\n");
    const disallowedHardwarePattern = new RegExp(
      [
        "AI" + "眼镜",
        "AI " + "眼镜",
        "智能" + "眼镜",
        "gl" + "asses",
        "Gl" + "asses",
        "Barco" + "sense",
      ].join("|"),
    );

    expect(content).not.toMatch(disallowedHardwarePattern);
  });

  it("does not add medical diagnosis or prescription wording", () => {
    const content = files.map(readProjectFile).join("\n");
    const disallowedMedicalPattern = new RegExp(
      [
        "诊断" + "为",
        "可能" + "患有",
        "建议调整" + "剂量",
        "药物治疗" + "建议",
      ].join("|"),
    );

    expect(content).not.toMatch(disallowedMedicalPattern);
  });
});
