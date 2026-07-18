import { MetricConfig } from "./types";

export interface CatalogItem {
  key: string;
  label: string;
  category: string;
  unit: string;
  min?: number | null;
  max?: number | null;
  device: string;
  core?: boolean; // part of the recommended core dataset
  symptom?: boolean;
}

// Curated home-monitoring biomarkers (high-value subset of the full list),
// grouped by category with sensible default alert thresholds + source device.
export const CATALOG: CatalogItem[] = [
  // Anthropometrics
  { key: "weight", label: "Weight", category: "Anthropometrics", unit: "kg", min: null, max: null, device: "Smart scale", core: true },
  { key: "bmi", label: "Body Mass Index", category: "Anthropometrics", unit: "kg/m²", min: 18.5, max: 30, device: "Calculated", core: true },
  { key: "waist", label: "Waist circumference", category: "Anthropometrics", unit: "cm", min: null, max: 102, device: "Tape", core: true },
  { key: "bodyfat", label: "Body fat", category: "Anthropometrics", unit: "%", min: null, max: 32, device: "Smart scale" },

  // Vitals
  { key: "bp_sys", label: "Blood pressure (systolic)", category: "Vital signs", unit: "mmHg", min: 90, max: 140, device: "BP cuff", core: true },
  { key: "bp_dia", label: "Blood pressure (diastolic)", category: "Vital signs", unit: "mmHg", min: 60, max: 90, device: "BP cuff", core: true },
  { key: "hr", label: "Resting heart rate", category: "Vital signs", unit: "bpm", min: 50, max: 100, device: "Wearable", core: true },
  { key: "hrv", label: "Heart rate variability", category: "Vital signs", unit: "ms", min: 20, max: null, device: "Wearable", core: true },
  { key: "spo2", label: "Blood oxygen (SpO₂)", category: "Vital signs", unit: "%", min: 94, max: null, device: "Pulse oximeter", core: true },
  { key: "resp", label: "Respiratory rate", category: "Vital signs", unit: "/min", min: 12, max: 20, device: "Wearable" },
  { key: "temp", label: "Body temperature", category: "Vital signs", unit: "°C", min: 36, max: 37.8, device: "Thermometer", core: true },

  // Diabetes
  { key: "glucose_fast", label: "Fasting glucose", category: "Diabetes", unit: "mmol/L", min: 4, max: 7, device: "Glucose meter", core: true },
  { key: "cgm_tir", label: "Time in range (CGM)", category: "Diabetes", unit: "%", min: 70, max: null, device: "CGM", core: true },
  { key: "cgm_var", label: "Glucose variability", category: "Diabetes", unit: "%", min: null, max: 36, device: "CGM" },
  { key: "insulin", label: "Daily insulin dose", category: "Diabetes", unit: "units", min: null, max: null, device: "Self-report" },

  // Cardiac
  { key: "ecg_afib", label: "Irregular rhythm / AF detection", category: "Cardiac", unit: "event", min: null, max: null, device: "Single-lead ECG", symptom: true, core: true },
  { key: "recovery_hr", label: "Recovery heart rate", category: "Cardiac", unit: "bpm", min: 12, max: null, device: "Wearable" },

  // Activity
  { key: "steps", label: "Daily step count", category: "Activity", unit: "steps", min: 5000, max: null, device: "Wearable", core: true },
  { key: "active_min", label: "Active minutes", category: "Activity", unit: "min", min: 30, max: null, device: "Wearable", core: true },
  { key: "sedentary", label: "Sedentary time", category: "Activity", unit: "h", min: null, max: 8, device: "Wearable" },

  // Sleep
  { key: "sleep_dur", label: "Total sleep duration", category: "Sleep", unit: "h", min: 6, max: 9, device: "Wearable", core: true },
  { key: "sleep_eff", label: "Sleep efficiency", category: "Sleep", unit: "%", min: 85, max: null, device: "Wearable", core: true },

  // Lifestyle
  { key: "water", label: "Water intake", category: "Lifestyle", unit: "L", min: 1.5, max: null, device: "Self-report" },
  { key: "smoking", label: "Smoking status", category: "Lifestyle", unit: "", min: null, max: null, device: "Self-report", symptom: true },

  // Mental wellbeing
  { key: "mood", label: "Mood rating", category: "Mental wellbeing", unit: "/10", min: 4, max: null, device: "Self-report", core: true },
  { key: "stress", label: "Stress score", category: "Mental wellbeing", unit: "/10", min: null, max: 7, device: "Self-report" },
  { key: "fatigue", label: "Fatigue level", category: "Mental wellbeing", unit: "/10", min: null, max: 6, device: "Self-report", core: true },

  // Medication
  { key: "med_adherence", label: "Medication adherence", category: "Medication", unit: "%", min: 80, max: null, device: "Self-report", core: true },

  // Symptoms (report → alert)
  { key: "sym_chest", label: "Chest pain", category: "Symptoms", unit: "", device: "Self-report", symptom: true, core: true },
  { key: "sym_breath", label: "Shortness of breath", category: "Symptoms", unit: "", device: "Self-report", symptom: true, core: true },
  { key: "sym_palp", label: "Palpitations", category: "Symptoms", unit: "", device: "Self-report", symptom: true },
  { key: "sym_dizzy", label: "Dizziness", category: "Symptoms", unit: "", device: "Self-report", symptom: true },
  { key: "sym_swelling", label: "Leg swelling", category: "Symptoms", unit: "", device: "Self-report", symptom: true, core: true },
];

export const CATEGORIES = Array.from(new Set(CATALOG.map((c) => c.category)));

export function defaultMetrics(coreOnly = true): MetricConfig[] {
  return CATALOG.filter((c) => (coreOnly ? c.core : true)).map((c) => ({
    key: c.key, label: c.label, category: c.category, unit: c.unit,
    enabled: true, min: c.min ?? null, max: c.max ?? null,
    rule: c.symptom ? "Alert clinician if reported" : undefined,
  }));
}
