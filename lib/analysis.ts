import { Analysis, AnalysisFlags } from "./types";

// ponytail: rule-based analyzer used ONLY when the LLM is unavailable (no key / 429 / error).
// It reads the actual check-in and responds to it, so the demo is input-driven even offline.
// Ceiling: keyword matching, not real NLU. Upgrade path = add OpenAI credits → route uses the model.

const NO_FLAGS: AnalysisFlags = {
  functionalDeclineFromBaseline: false, worseningTrend: false, newExertionalSymptom: false,
  recentMedicationChange: false, symptomsAtRest: false, chestPain: false,
};

function short(text: string, n = 140) {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > n ? t.slice(0, n) + "…" : t;
}

export function analyzeHeuristic(transcriptRaw: string, opts: { hasImage?: boolean; caption?: string } = {}): Analysis {
  const raw = (transcriptRaw || "").trim();
  const t = raw.toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);
  const hasImage = !!opts.hasImage;

  // ---- image with no vision available ----
  if (hasImage) {
    const note = (opts.caption || raw || "").trim();
    return {
      summary: `The patient shared a photo${note ? ` with the note: "${short(note)}"` : ""}. Automatic image analysis needs the AI service (currently offline), so the image has been saved for clinician review.`,
      followUpQuestion: note ? "Thanks for the photo. Can you tell me in a few words what you'd like your care team to look at?" : "Thanks for the photo. What would you like your care team to look at in it?",
      patientMessage: "Got your photo — it's saved and shared with your care team to review.",
      changes: [note ? `Photo shared: ${short(note, 60)}` : "Photo shared for review"],
      missingInfo: ["Automatic image findings (AI vision offline)"],
      imageFinding: "Image saved — AI vision analysis unavailable in this session.",
      unclear: !note,
      flags: { ...NO_FLAGS },
      source: "fallback",
    };
  }

  // ---- insufficient information ----
  const fillerOnly = /^(hi|hello|hey|um+|uh+|yeah|yes|no|ok|okay|nothing|dunno|i don'?t know|test|testing|hmm+)\b[\s.!?]*$/.test(t);
  if (words.length < 3 || fillerOnly) {
    return {
      summary: "This check-in did not contain enough information to assess any change from the patient's baseline. No specific symptoms or wellbeing details were provided.",
      followUpQuestion: "Sorry, I didn't quite catch that. Could you tell me a little about how you've been feeling since your last check-in — your energy, breathing, sleep, or anything new?",
      patientMessage: "I didn't quite get that — no problem at all. Whenever you're ready, just tell me how you've been and I'll pass it on to your care team.",
      changes: ["No clear information provided in this check-in"],
      missingInfo: ["A description of current symptoms or how the patient is feeling"],
      unclear: true,
      flags: { ...NO_FLAGS },
      source: "fallback",
    };
  }

  const quote = short(raw, 120);

  // ---- red flags → High ----
  const chestPain = /chest pain|tight chest|pressure in (my )?chest|pain in (my )?chest/.test(t);
  const restBreath = /(can'?t|cannot|hard to|struggl\w*|difficult\w*) (to )?breath|breathless.{0,20}(rest|sitting|lying|doing nothing)|short of breath.{0,20}(rest|sitting|lying)/.test(t);
  const collapse = /collaps|passed out|fainted|black(ed)? out|unconscious/.test(t);
  if (chestPain || restBreath || collapse) {
    const what = chestPain ? "chest pain" : collapse ? "a collapse / loss of consciousness" : "breathlessness at rest";
    return {
      summary: `Patient reports ${what} ("${quote}"). This is a potential red-flag symptom and warrants urgent clinical review.`,
      followUpQuestion: "That sounds important. Is it happening right now, and do you have chest pain or trouble breathing while sitting still?",
      patientMessage: "Thank you for telling me. Because of what you've described, please use your service's urgent guidance if it gets worse — I'm flagging this to your care team now.",
      changes: [`Reported: ${what}`],
      missingInfo: ["Current oxygen saturation", "Whether symptoms are present right now"],
      flags: { ...NO_FLAGS, chestPain, symptomsAtRest: restBreath || collapse, newExertionalSymptom: true, worseningTrend: true },
      source: "fallback",
    };
  }

  // ---- symptom detection ----
  const SYMS: { re: RegExp; label: string; follow: string; exertional?: boolean }[] = [
    { re: /breath|short of breath|breathless|winded|puffed/, label: "breathlessness", follow: "Does the breathlessness happen at rest, or only when you're moving around?", exertional: true },
    { re: /tired|fatigue|exhaust|no energy|worn out|drained/, label: "increased tiredness", follow: "Is the tiredness there during normal daily activities, or only after exertion?", exertional: true },
    { re: /dizz|light-?headed|faint/, label: "dizziness", follow: "Does the dizziness come on when you stand up, or at other times too?" },
    { re: /swollen|swelling|puffy|puffed up|ankles/, label: "swelling", follow: "Where is the swelling, and is it in both legs or just one?" },
    { re: /nausea|feel sick|vomit|throwing up/, label: "nausea", follow: "Is the nausea linked to your medication or to eating, or does it come at random?" },
    { re: /headache|migraine/, label: "a headache", follow: "How long has the headache lasted, and is it worse than usual?" },
    { re: /palpitat|heart racing|racing heart|fluttering/, label: "palpitations", follow: "Do the palpitations come and go, or are they constant?" },
    { re: /cough/, label: "a cough", follow: "Is the cough bringing anything up, and have you had a temperature?" },
    { re: /sleep|insomnia|can'?t sleep|not sleeping/, label: "disturbed sleep", follow: "Is the poor sleep new this week, and is anything keeping you awake?" },
    { re: /pain|ache|sore|hurts/, label: "pain", follow: "Where is the pain, and how bad is it out of ten?" },
    { re: /sugar|glucose|hypo|hyper|diabet/, label: "blood-sugar changes", follow: "What have your recent glucose readings been?" },
    { re: /blood pressure|\bbp\b/, label: "blood-pressure concerns", follow: "What was your most recent blood-pressure reading?" },
    { re: /weight|heavier|gained/, label: "weight change", follow: "How much has your weight changed, and over how long?" },
    { re: /stair|walk|walking|climb/, label: "reduced activity", follow: "Compared with your usual, are you doing less than normal?", exertional: true },
  ];
  const found = SYMS.filter((s) => s.re.test(t));

  const positive = /(feel|feeling|been|doing|i'?m|im)\s+(good|great|fine|ok|okay|well|better|normal|the same|alright)|no (change|problems?|issues?|symptoms?|complaints?)|nothing (wrong|new|much)|all good|same as (usual|always)/.test(t);

  // ---- feeling well ----
  if (positive && found.length === 0) {
    return {
      summary: `Patient reports feeling well with no new symptoms ("${quote}"). No change from their usual pattern.`,
      followUpQuestion: "Glad to hear it. Is there anything at all that's felt a little different — even small changes in sleep, energy, or appetite?",
      patientMessage: "That's great to hear. Keep doing what you're doing — I'll check in with you again as planned.",
      changes: ["No change reported — patient feeling well"],
      missingInfo: [],
      flags: { ...NO_FLAGS },
      source: "fallback",
    };
  }

  // ---- symptoms present → Medium ----
  if (found.length) {
    const labels = found.map((s) => s.label);
    const exertional = found.some((s) => s.exertional);
    return {
      summary: `Patient reports ${labels.slice(0, 3).join(", ")} ("${quote}"). Warrants follow-up to understand severity and whether it differs from their baseline.`,
      followUpQuestion: found[0].follow,
      patientMessage: `Thanks for sharing that — I've noted your ${labels[0]} and passed it to your care team.`,
      changes: labels.slice(0, 4).map((l) => l[0].toUpperCase() + l.slice(1)),
      missingInfo: ["How long this has been going on", "Whether it is getting worse"],
      flags: { ...NO_FLAGS, newExertionalSymptom: exertional, worseningTrend: found.length >= 2 },
      source: "fallback",
    };
  }

  // ---- something was said, but no clear clinical signal ----
  return {
    summary: `Patient said: "${quote}". No specific symptom pattern was identified; may need a person to interpret.`,
    followUpQuestion: "Thanks for that. Just so I understand — has anything about your health felt different this week, better or worse?",
    patientMessage: "Thanks for the update — I've saved it and your care team can see it.",
    changes: ["Check-in recorded — no clear clinical change detected"],
    missingInfo: ["A clearer description of any symptoms or changes"],
    unclear: true,
    flags: { ...NO_FLAGS },
    source: "fallback",
  };
}
