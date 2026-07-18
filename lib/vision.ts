import { Analysis, Priority } from "./types";
import { P } from "./icons";

export interface VisionType {
  key: string;
  group: string;
  label: string;
  input: "image" | "video";
  biomarker: string;
  disease: string;
  outcome: string;   // sample finding used for the demo / when the model is offline
  priority: Priority;
}

// Condensed from the face/body/foot/eye/skin/gait/exercise/chest/hand/meal
// analysis matrix. `outcome` is an illustrative finding for the demo.
export const VISION: VisionType[] = [
  // Face
  { key: "face_adiposity", group: "Face", label: "Facial adiposity", input: "image", biomarker: "Body-fat estimate from face", disease: "Obesity", outcome: "Facial adiposity consistent with an overweight BMI range (~28–30).", priority: "Low" },
  { key: "face_edema", group: "Face", label: "Facial / periorbital edema", input: "image", biomarker: "Fluid retention", disease: "Heart failure", outcome: "Mild periorbital puffiness noted — possible fluid retention; worth correlating with weight.", priority: "Medium" },
  { key: "face_pallor", group: "Face", label: "Pallor / cyanosis", input: "image", biomarker: "Perfusion / oxygenation", disease: "CVD", outcome: "No pallor or cyanosis detected in the lips or face.", priority: "Low" },
  { key: "face_rppg", group: "Face", label: "Remote heart rate (rPPG)", input: "video", biomarker: "Heart rate + variability", disease: "CVD", outcome: "Estimated heart rate 74 bpm and HRV ~41 ms from facial video — within normal range.", priority: "Low" },
  { key: "face_resp", group: "Face", label: "Respiratory rate", input: "video", biomarker: "Breaths per minute", disease: "CVD", outcome: "Respiratory rate ~17 breaths/min — regular.", priority: "Low" },

  // Body
  { key: "body_bmi", group: "Body", label: "BMI estimation", input: "image", biomarker: "Body Mass Index", disease: "Obesity", outcome: "Estimated BMI ~31 (obese range) from full-body image.", priority: "Medium" },
  { key: "body_waist", group: "Body", label: "Waist circumference", input: "image", biomarker: "Central adiposity", disease: "Obesity · Diabetes", outcome: "Estimated waist ~104 cm — above the cardiometabolic threshold.", priority: "Medium" },
  { key: "body_progress", group: "Body", label: "Weight-loss progress", input: "image", biomarker: "Progression vs prior", disease: "Obesity", outcome: "Body composition improved vs the last progress photo — trending down.", priority: "Low" },

  // Foot
  { key: "foot_ulcer", group: "Foot", label: "Diabetic foot ulcer", input: "image", biomarker: "Ulcer detection", disease: "Diabetes", outcome: "No active ulcer detected; a dry, callused area on the left forefoot to monitor.", priority: "Medium" },
  { key: "foot_wound", group: "Foot", label: "Wound progression", input: "image", biomarker: "Healing trajectory", disease: "Diabetes", outcome: "Wound margins appear smaller than the previous image — healing.", priority: "Low" },
  { key: "foot_infection", group: "Foot", label: "Infection / discoloration", input: "image", biomarker: "Inflammation", disease: "Diabetes", outcome: "Localized redness on the right forefoot — early inflammation; review advised.", priority: "High" },

  // Eye
  { key: "eye_pallor", group: "Eye", label: "Conjunctival pallor", input: "image", biomarker: "Anaemia screen", disease: "General health", outcome: "No conjunctival pallor observed.", priority: "Low" },
  { key: "eye_retina", group: "Eye", label: "Retinal / retinopathy screen", input: "image", biomarker: "Diabetic retinopathy", disease: "Diabetes", outcome: "Image quality sufficient; no obvious retinopathy (screening, not diagnostic).", priority: "Low" },

  // Skin
  { key: "skin_acanthosis", group: "Skin", label: "Acanthosis nigricans", input: "image", biomarker: "Insulin resistance sign", disease: "Diabetes · Obesity", outcome: "Darkened, velvety skin at the neck — consistent with acanthosis nigricans.", priority: "Medium" },
  { key: "skin_healing", group: "Skin", label: "Wound healing / lesion", input: "image", biomarker: "Healing rate", disease: "Diabetes", outcome: "Skin lesion healing slowly — keep monitoring.", priority: "Low" },

  // Gait
  { key: "gait_speed", group: "Gait", label: "Walking speed", input: "video", biomarker: "Functional mobility", disease: "CVD · Obesity", outcome: "Walking speed ~0.9 m/s — mildly reduced vs age norm.", priority: "Medium" },
  { key: "gait_fall", group: "Gait", label: "Balance / fall risk", input: "video", biomarker: "Fall risk", disease: "CVD", outcome: "Gait steady and symmetric — low fall risk.", priority: "Low" },

  // Exercise
  { key: "ex_sts", group: "Exercise", label: "Sit-to-stand test", input: "video", biomarker: "Lower-limb strength", disease: "CVD", outcome: "11 sit-to-stands in 30s — slightly below the age-expected range.", priority: "Medium" },
  { key: "ex_squat", group: "Exercise", label: "Squat quality", input: "video", biomarker: "Movement quality", disease: "Obesity", outcome: "Adequate squat depth and good form.", priority: "Low" },

  // Chest
  { key: "chest_breath", group: "Chest", label: "Breathing pattern", input: "video", biomarker: "Respiratory effort", disease: "Heart failure", outcome: "Regular breathing, respiratory rate ~18/min; no obvious increased effort.", priority: "Low" },

  // Hand
  { key: "hand_hr", group: "Hand", label: "Fingertip heart rate", input: "video", biomarker: "Pulse / SpO₂", disease: "CVD", outcome: "Fingertip pulse: heart rate 76 bpm, estimated SpO₂ 97%.", priority: "Low" },

  // Meal
  { key: "meal_cal", group: "Meal", label: "Meal calories & carbs", input: "image", biomarker: "Calorie / carb estimate", disease: "Obesity · Diabetes", outcome: "Grilled chicken with rice and salad — ~620 kcal, ~72 g carbohydrate.", priority: "Low" },
  { key: "meal_nutri", group: "Meal", label: "Nutritional analysis", input: "image", biomarker: "Macronutrients", disease: "All", outcome: "Balanced plate; protein good, carbohydrate slightly high for target.", priority: "Low" },
];

const GROUP_ICON: Record<string, string> = {
  Face: P.user, Body: P.activity, Foot: P.gauge, Eye: P.info, Skin: P.drop,
  Gait: P.activity, Exercise: P.heart, Chest: P.video, Hand: P.gauge, Meal: P.camera,
};

export function visionGroups(input: "image" | "video") {
  const groups = Array.from(new Set(VISION.filter((v) => v.input === input).map((v) => v.group)));
  return groups.map((g) => ({ group: g, icon: GROUP_ICON[g] || P.camera, types: VISION.filter((v) => v.input === input && v.group === g) }));
}

export function getVisionType(key?: string) {
  return key ? VISION.find((v) => v.key === key) : undefined;
}

// Build an analysis from a vision selection (used when the model is offline,
// and as the grounded base when it is available).
export function visionAnalysis(key: string): Analysis {
  const v = getVisionType(key);
  if (!v) return { summary: "Image received.", followUpQuestion: "Anything you'd like your care team to know?", patientMessage: "Thanks — saved for your care team.", changes: ["Image shared"], missingInfo: [], imageFinding: "", flags: baseFlags(), source: "fallback" };
  return {
    summary: `${v.label} (${v.biomarker}, relevant to ${v.disease}). ${v.outcome}`,
    followUpQuestion: "Would you like to add anything about how you've been feeling alongside this?",
    patientMessage: `Thanks — I've analysed your ${v.label.toLowerCase()} and shared the result with your care team.`,
    changes: [`${v.label}: ${v.biomarker}`],
    missingInfo: [],
    imageFinding: v.outcome,
    flags: { ...baseFlags(), functionalDeclineFromBaseline: v.priority === "High", worseningTrend: v.priority !== "Low", newExertionalSymptom: false },
    source: "fallback",
  };
}

function baseFlags() {
  return { functionalDeclineFromBaseline: false, worseningTrend: false, newExertionalSymptom: false, recentMedicationChange: false, symptomsAtRest: false, chestPain: false };
}
