export type Priority = "Low" | "Medium" | "High";

export type CheckinMode = "call" | "text" | "voice" | "video" | "image";

export interface AnalysisFlags {
  functionalDeclineFromBaseline: boolean;
  worseningTrend: boolean;
  newExertionalSymptom: boolean;
  recentMedicationChange: boolean;
  symptomsAtRest: boolean;
  chestPain: boolean;
}

export interface Analysis {
  summary: string;
  followUpQuestion: string;
  patientMessage: string;
  changes: string[];
  missingInfo: string[];
  imageFinding?: string;
  unclear?: boolean;
  flags: AnalysisFlags;
  source: "openai" | "fallback";
}

export interface Checkin {
  id: string;
  when: string;
  mode: CheckinMode;
  transcript: string;
  imageDataUrl?: string;
  imageFinding?: string;
  analysis: Analysis;
  followUpAnswer?: string;
  priority: Priority;
  seeded?: boolean;
}

export interface Device {
  id: string;
  name: string;
  kind: string;
  icon: string; // svg path
  connected: boolean;
  reading: string;
  sub: string;
  spark: number[];
  accent: "teal" | "amber" | "green" | "orange";
}

export interface MetricConfig {
  key: string;
  label: string;
  category: string;
  unit: string;
  enabled: boolean;
  min?: number | null;
  max?: number | null;
  rule?: string;
}

export interface PatientPlan {
  initialFrequencyDays: number; // closer monitoring window, e.g. 14 days
  regularFrequency: string;     // e.g. "Weekly"
  metrics: MetricConfig[];
}

export interface Patient {
  id: string;
  name: string;
  initials: string;
  age: number;
  sex?: string;
  ethnicity?: string;
  heightCm?: number;
  condition: string;
  conditionShort: string;
  medication: string;
  adjustment: string;
  monitoring: string;
  clinician: string;
  priority: Priority;
  lastCheckin: string;
  changeFromBaseline: string;
  nextAction: string;
  monitoringPlan: string;
  reviewRequested: boolean;
  isNew?: boolean;
  consented?: boolean;
  streak?: number;
  plan?: PatientPlan;
  checkins: Checkin[];
  devices: Device[];
}
