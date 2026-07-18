import { Patient, Analysis, Device, Checkin, Priority } from "./types";
import { P } from "./icons";

function ci(id: string, when: string, mode: any, text: string, msg: string, changes: string[], priority: Priority): Checkin {
  return {
    id, when, mode, transcript: text, seeded: true, priority,
    analysis: {
      summary: text, followUpQuestion: "", patientMessage: msg, changes, missingInfo: [],
      flags: { functionalDeclineFromBaseline: false, worseningTrend: false, newExertionalSymptom: false, recentMedicationChange: false, symptomsAtRest: false, chestPain: false },
      source: "fallback",
    },
  };
}

function recentFor(id: string): Checkin[] {
  if (id === "sarah") return [
    ci("s1", "Yesterday", "voice", "Did a shorter walk than usual", "Thanks Sarah — noted for your care team.", ["Reduced evening walk"], "Medium"),
    ci("s2", "2 days ago", "text", "A bit more tired but managing", "Thanks for checking in.", ["Mild tiredness"], "Low"),
    ci("s3", "3 days ago", "call", "Feeling about the same", "Good to hear — keep it up.", ["No change reported"], "Low"),
  ];
  if (id === "aisha") return [
    ci("a1", "Yesterday", "voice", "Sugars have been steady", "Great — thanks for the update.", ["Glucose steady"], "Low"),
    ci("a2", "2 days ago", "text", "Missed my glucose reading", "No problem — try again today.", ["Missed a reading"], "Medium"),
  ];
  if (id === "michael") return [
    ci("m1", "Yesterday", "call", "No breathlessness, weight stable", "Excellent — well done.", ["Stable"], "Low"),
    ci("m2", "2 days ago", "voice", "Feeling good, walked the dog", "Lovely — keep it up.", ["Active as usual"], "Low"),
    ci("m3", "3 days ago", "text", "All normal today", "Great, thanks.", ["No change"], "Low"),
  ];
  return [];
}

export const APP_NAME = "Ambient Intelligence";

export function blankDevices(): Device[] {
  return devices().map((d) => ({ ...d, connected: false }));
}

function devices(): Device[] {
  return [
    { id: "watch", name: "Apple Watch", kind: "Heart rate · activity", icon: P.watch, connected: false, reading: "68 bpm resting", sub: "Steps 3,240 today", spark: [72, 70, 69, 71, 68, 67, 68], accent: "teal" },
    { id: "fitbit", name: "Fitbit Charge", kind: "Sleep · steps", icon: P.activity, connected: false, reading: "6h 12m sleep", sub: "Restless 3 nights", spark: [7.1, 6.8, 6.5, 6.2, 6.4, 6.1, 6.2], accent: "amber" },
    { id: "bp", name: "Blood-pressure cuff", kind: "Omron · home BP", icon: P.gauge, connected: true, reading: "138 / 84 mmHg", sub: "Measured 2 days ago", spark: [128, 130, 132, 134, 136, 137, 138], accent: "amber" },
    { id: "cgm", name: "Glucose (CGM)", kind: "Continuous glucose", icon: P.drop, connected: false, reading: "6.4 mmol/L", sub: "In range 82%", spark: [6.1, 6.3, 6.0, 6.5, 6.4, 6.2, 6.4], accent: "teal" },
    { id: "scale", name: "Smart scale", kind: "Weight · trend", icon: P.chart, connected: false, reading: "78.4 kg", sub: "+0.6 kg this week", spark: [77.5, 77.7, 77.9, 78.0, 78.2, 78.3, 78.4], accent: "orange" },
  ];
}

// Scripted analysis used when no API key / API failure — keeps the demo alive.
export const FALLBACK_ANALYSIS: Analysis = {
  summary:
    "Patient reports a progressive reduction in functional capacity following a recent medication adjustment. Previously managed stairs without stopping but now stops halfway because of fatigue and breathlessness. Follow-up confirms breathlessness occurs only during activity, not at rest. A same-day clinician review is recommended because the change is persistent and differs meaningfully from personal baseline.",
  followUpQuestion:
    "You normally manage the stairs without stopping. Are you also short of breath while resting, or only when you are moving around?",
  patientMessage:
    "Thanks for sharing that, Sarah. I've noted the change in your energy and added it to your timeline. Your care team will take a look today — in the meantime, take stairs slowly and rest when you need to.",
  changes: [
    "Stops halfway while climbing stairs",
    "Walking frequency reduced",
    "Fatigue occurs during normal activity",
    "Breathlessness reported during exertion",
  ],
  missingInfo: ["Current oxygen saturation", "Resting heart rate", "Updated blood-pressure reading"],
  flags: {
    functionalDeclineFromBaseline: true,
    worseningTrend: true,
    newExertionalSymptom: true,
    recentMedicationChange: true,
    symptomsAtRest: false,
    chestPain: false,
  },
  source: "fallback",
};

export const DEFAULT_TRANSCRIPT =
  "I'm mostly okay, but I've been getting tired much more quickly. I had to stop halfway while going upstairs today.";

export function seedPatients(): Patient[] {
  const seeded: Patient[] = [
    {
      id: "sarah",
      name: "Sarah Mitchell",
      streak: 12,
      initials: "SM",
      age: 58,
      condition: "Chronic cardiometabolic condition",
      conditionShort: "Cardiometabolic",
      medication: "Ramipril 5 mg",
      adjustment: "Dose ↑ 3 weeks ago",
      monitoring: "Weekly voice check-ins",
      clinician: "Dr R. Patel",
      priority: "High",
      lastCheckin: "today, 8:12 am",
      changeFromBaseline: "Functional decline — stops on stairs",
      nextAction: "Same-day clinician review",
      monitoringPlan: "Weekly",
      reviewRequested: true,
      consented: true,
      checkins: [],
      devices: devices(),
    },
    {
      id: "aisha",
      name: "Aisha Khan",
      streak: 5,
      initials: "AK",
      age: 51,
      condition: "Type 2 diabetes · hypertension",
      conditionShort: "T2DM · HTN",
      medication: "Metformin 1 g",
      adjustment: "No recent change",
      monitoring: "Weekly voice check-ins",
      clinician: "Dr R. Patel",
      priority: "Medium",
      lastCheckin: "yesterday",
      changeFromBaseline: "Missed 2 home glucose readings",
      nextAction: "Request home measurement",
      monitoringPlan: "Weekly",
      reviewRequested: false,
      consented: true,
      checkins: [],
      devices: devices().map((d) => (d.id === "cgm" ? { ...d, connected: true } : d)),
    },
    {
      id: "michael",
      name: "Michael Green",
      streak: 20,
      initials: "MG",
      age: 64,
      condition: "Heart failure · stable",
      conditionShort: "Heart failure",
      medication: "Bisoprolol 2.5 mg",
      adjustment: "No recent change",
      monitoring: "Weekly voice check-ins",
      clinician: "Dr R. Patel",
      priority: "Low",
      lastCheckin: "2 days ago",
      changeFromBaseline: "No change from baseline",
      nextAction: "Continue weekly check-ins",
      monitoringPlan: "Weekly",
      reviewRequested: false,
      consented: true,
      checkins: [],
      devices: devices().map((d) => (d.id === "watch" ? { ...d, connected: true } : d)),
    },
  ];
  return seeded.map((p) => ({ ...p, checkins: recentFor(p.id) }));
}

// Rich canned clinical content for the narrative screen (Sarah).
export const SARAH_NARRATIVE = {
  patientFacts: [
    { k: "Age", v: "58" },
    { k: "Condition", v: "Chronic cardiometabolic" },
    { k: "Current medication", v: "Ramipril 5 mg" },
    { k: "Recent adjustment", v: "Dose ↑ 3 weeks ago" },
    { k: "Monitoring", v: "Weekly voice check-ins" },
    { k: "Assigned clinician", v: "Dr R. Patel" },
  ],
  prevState: [
    "Climbed stairs without stopping",
    "Evening walks continued",
    "Mild fatigue only after extended activity",
    "No breathlessness reported",
  ],
  currDefs: [
    { text: "Stops halfway while climbing stairs", obs: "stairs", quote: "q2", changed: true },
    { text: "Walking frequency reduced", obs: "walk", quote: null, changed: true },
    { text: "Fatigue occurs during normal activity", obs: "fatigue", quote: "q1", changed: true },
    { text: "Breathlessness reported during exertion", obs: "exertion", quote: "q3", changed: true },
    { text: "No breathlessness while resting", obs: "rest", quote: "q4", changed: false },
  ],
  baseline: [
    { dim: "Functional ability", usual: "Manages stairs and daily walks", current: "Stops halfway on stairs; walks reduced", evidence: '"I had to stop halfway while going upstairs today."', dir: "decline" },
    { dim: "Symptoms", usual: "No breathlessness", current: "Breathlessness on exertion only", evidence: '"Only when I\'m moving around."', dir: "worse" },
    { dim: "Medication tolerance", usual: "Nausea after dose change, since settled", current: "No current nausea reported", evidence: "Nausea resolved 12 days ago", dir: "stable" },
    { dim: "Daily routine", usual: "Regular evening walks", current: "Walking frequency reduced", evidence: "Reduced activity across 2 check-ins", dir: "worse" },
  ],
  timeline: [
    { id: "med", label: "Medication adjusted", when: "3 weeks ago", kind: "plan", note: "The dose of Ramipril was increased at the last clinic review to improve blood-pressure control." },
    { id: "nausea", label: "Mild nausea", when: "19 days ago", kind: "symptom", note: "Sarah reported mild nausea shortly after the dose change — a recognised, usually transient effect." },
    { id: "nauseaImp", label: "Nausea improved", when: "12 days ago", kind: "symptom", note: "Nausea settled on its own without any change to the plan." },
    { id: "fatigue", label: "Increased fatigue reported", when: "8 days ago", kind: "change", note: "Fatigue began appearing during normal daily activity, earlier than her usual pattern." },
    { id: "walk", label: "Walking reduced", when: "5 days ago", kind: "change", note: "Evening walks became less frequent across two consecutive check-ins." },
    { id: "stairs", label: "Difficulty with stairs", when: "Today", kind: "change", note: "For the first time, Sarah stopped halfway while climbing stairs because of fatigue and breathlessness." },
    { id: "followup", label: "Adaptive follow-up completed", when: "Today", kind: "ai", note: "A single follow-up question confirmed breathlessness occurs only on exertion, not at rest — narrowing the clinical picture." },
    { id: "review", label: "Clinician review requested", when: "Today", kind: "review", note: "Review priority set to High — review today, pending clinician confirmation." },
  ],
  quotes: [
    { id: "q1", text: "I've been getting tired much more quickly", obs: "fatigue", supports: "Fatigue during normal activity" },
    { id: "q2", text: "I had to stop halfway while going upstairs today", obs: "stairs", supports: "Stops halfway on stairs" },
    { id: "q3", text: "Only when I'm moving around", obs: "exertion", supports: "Breathlessness on exertion" },
    { id: "q4", text: "I'm fine when I'm sitting", obs: "rest", supports: "No breathlessness at rest" },
  ],
  known: ["Functional ability has declined", "Breathlessness occurs during activity", "Medication was recently adjusted", "No chest pain reported"],
  resolved: ["No breathlessness while resting"],
  missing: ["Current oxygen saturation", "Resting heart rate", "Updated blood-pressure reading"],
};
