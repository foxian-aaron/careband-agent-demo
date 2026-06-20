import type { DemoState } from "../store/demoStore";

export const getElderViewModel = (state: DemoState, elderId: string) => {
  const profile = state.profiles[elderId];
  if (!profile) {
    return {
      found: false as const,
      elderId,
    };
  }

  return {
    found: true as const,
    elderId,
    profile,
    baseline: state.baselines[elderId],
    snapshot: state.snapshots[elderId],
    trend: state.trends[elderId],
  };
};

