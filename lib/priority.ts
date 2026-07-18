import { AnalysisFlags, Priority } from "./types";

export interface PriorityResult {
  priority: Priority;
  route: string;
  raiseReasons: string[];
  lowerReasons: string[];
}

// Transparent rules — the model surfaces evidence, but the final priority is
// deterministic code. AI never decides; it only informs.
export function computePriority(flags: AnalysisFlags): PriorityResult {
  const raise: string[] = [];
  const lower: string[] = [];

  if (flags.functionalDeclineFromBaseline) raise.push("Meaningful functional decline from personal baseline");
  if (flags.worseningTrend) raise.push("Worsening trend across consecutive check-ins");
  if (flags.newExertionalSymptom) raise.push("New exertional breathlessness");
  if (flags.recentMedicationChange) raise.push("Recent medication change");
  if (flags.chestPain) raise.push("Chest pain reported");
  if (flags.symptomsAtRest) raise.push("Symptoms occurring at rest");

  if (!flags.symptomsAtRest) lower.push("No breathlessness while resting");
  if (!flags.chestPain) lower.push("No chest pain reported");

  // Red-flag override → always High
  if (flags.chestPain || flags.symptomsAtRest) {
    return { priority: "High", route: "urgent_clinic", raiseReasons: raise, lowerReasons: lower };
  }

  const concernCount =
    (flags.functionalDeclineFromBaseline ? 1 : 0) +
    (flags.worseningTrend ? 1 : 0) +
    (flags.newExertionalSymptom ? 1 : 0);

  if (flags.functionalDeclineFromBaseline && (flags.newExertionalSymptom || flags.worseningTrend)) {
    return { priority: "High", route: "routine_review", raiseReasons: raise, lowerReasons: lower };
  }
  if (concernCount >= 1 || flags.recentMedicationChange) {
    return { priority: "Medium", route: "routine_review", raiseReasons: raise, lowerReasons: lower };
  }
  return { priority: "Low", route: "monitor", raiseReasons: raise.length ? raise : ["No change from personal baseline"], lowerReasons: lower };
}

export const PRIORITY_META: Record<Priority, { label: string; accent: string; bg: string; fg: string; note: string }> = {
  High: { label: "High · Review today", accent: "var(--orange)", bg: "var(--orange-100)", fg: "var(--orange-d)", note: "Clinical decision required" },
  Medium: { label: "Medium · Follow-up info needed", accent: "var(--amber)", bg: "var(--amber-100)", fg: "var(--amber-d)", note: "Additional information requested" },
  Low: { label: "Low · Stable", accent: "var(--green)", bg: "var(--green-100)", fg: "var(--green-d)", note: "Continue routine monitoring" },
};
