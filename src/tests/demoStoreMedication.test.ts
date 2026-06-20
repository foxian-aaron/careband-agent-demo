import { describe, expect, it } from "vitest";
import { createInitialDemoState, demoReducer } from "../store/demoStore";

describe("demoStore medication flow", () => {
  it("CONFIRM_EVENING_MEDICATION syncs snapshot, medication plan and events", () => {
    const state = demoReducer(createInitialDemoState(), {
      type: "CONFIRM_EVENING_MEDICATION",
    });
    const eveningDose = state.medicationPlans.E001.doses.find(
      (dose) => dose.doseId === "MED-E001-EVENING",
    );

    expect(state.snapshots.E001.medicationEvening).toBe("confirmed");
    expect(eveningDose?.status).toBe("confirmed");
    expect(eveningDose?.confirmedBy).toBe("护工A");
    expect(eveningDose?.confirmSource).toBe("caregiver");
    expect(
      state.events.some((event) => event.eventId === "EVT-E001-MED-PM-CONFIRMED"),
    ).toBe(true);
  });

  it("RESET_DEMO restores evening medication to not_confirmed", () => {
    const confirmed = demoReducer(createInitialDemoState(), {
      type: "CONFIRM_EVENING_MEDICATION",
    });
    const reset = demoReducer(confirmed, { type: "RESET_DEMO" });
    const eveningDose = reset.medicationPlans.E001.doses.find(
      (dose) => dose.doseId === "MED-E001-EVENING",
    );

    expect(reset.snapshots.E001.medicationEvening).toBe("not_confirmed");
    expect(eveningDose?.status).toBe("not_confirmed");
    expect(
      reset.events.some((event) => event.eventId === "EVT-E001-MED-PM-CONFIRMED"),
    ).toBe(false);
  });
});
