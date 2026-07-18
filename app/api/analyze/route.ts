import { NextRequest, NextResponse } from "next/server";
import { getClient, CHAT_MODEL, SYSTEM_PROMPT, PATIENT_CONTEXT } from "@/lib/openai";
import { analyzeHeuristic } from "@/lib/analysis";
import { getVisionType, visionAnalysis } from "@/lib/vision";
import { Analysis } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function offline(transcript: string, hasImage: boolean, caption?: string, visionType?: string) {
  return visionType ? visionAnalysis(visionType) : analyzeHeuristic(transcript, { hasImage, caption });
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const transcript: string = (body.transcript || "").toString().slice(0, 4000);
  const imageDataUrl: string | undefined = body.imageDataUrl;
  const caption: string | undefined = body.caption;
  const visionType: string | undefined = body.visionType;
  const hasImage = !!(imageDataUrl && imageDataUrl.startsWith("data:image"));
  const vt = getVisionType(visionType);

  const client = getClient();
  if (!client) return NextResponse.json(offline(transcript, hasImage, caption, visionType));

  try {
    const visionInstruction = vt
      ? `\n\nThis check-in is a targeted ${vt.input} analysis: "${vt.label}" — assess ${vt.biomarker} (relevant to ${vt.disease}). Base "imageFinding" and "summary" on what you actually observe for this specific analysis.`
      : "";
    const userContent: any[] = [
      { type: "text", text: `PATIENT BASELINE CONTEXT:\n${PATIENT_CONTEXT}\n\nLATEST CHECK-IN TRANSCRIPT:\n"${transcript || "(no words — see image)"}"${visionInstruction}\n\nReturn the JSON now.` },
    ];
    if (imageDataUrl && imageDataUrl.startsWith("data:image")) {
      userContent.push({ type: "image_url", image_url: { url: imageDataUrl } });
    }
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ];

    const parsed = await callModel(client, messages);
    if (!parsed?.summary) throw new Error("no summary");

    const analysis: Analysis = {
      summary: parsed.summary || "Check-in recorded; no automatic summary available.",
      followUpQuestion: parsed.followUpQuestion || "Is there anything else about how you've been feeling that you'd like your care team to know?",
      patientMessage: parsed.patientMessage || "Thanks for checking in — your care team can see this.",
      changes: Array.isArray(parsed.changes) && parsed.changes.length ? parsed.changes : ["Check-in recorded"],
      missingInfo: Array.isArray(parsed.missingInfo) ? parsed.missingInfo : [],
      imageFinding: parsed.imageFinding || "",
      unclear: !!parsed.unclear,
      flags: {
        functionalDeclineFromBaseline: !!parsed.flags?.functionalDeclineFromBaseline,
        worseningTrend: !!parsed.flags?.worseningTrend,
        newExertionalSymptom: !!parsed.flags?.newExertionalSymptom,
        recentMedicationChange: !!parsed.flags?.recentMedicationChange,
        symptomsAtRest: !!parsed.flags?.symptomsAtRest,
        chestPain: !!parsed.flags?.chestPain,
      },
      source: "openai",
    };
    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json(offline(transcript, hasImage, caption, visionType));
  }
}

// Progressive fallback so reasoning models (e.g. GPT-5.6 Terra) work:
// drop `temperature` if rejected, then drop `response_format` if unsupported.
async function callModel(client: any, messages: any[]): Promise<any> {
  const base = { model: CHAT_MODEL, messages };
  const attempts = [
    { ...base, temperature: 0.4, response_format: { type: "json_object" } },
    { ...base, response_format: { type: "json_object" } },
    { ...base },
  ];
  let lastErr: any;
  for (const params of attempts) {
    try {
      const c = await client.chat.completions.create(params);
      const raw = c.choices?.[0]?.message?.content || "";
      const parsed = extractJson(raw);
      if (parsed) return parsed;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("no usable response");
}

function extractJson(raw: string): any | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch {}
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const a = cleaned.indexOf("{"), b = cleaned.lastIndexOf("}");
  if (a !== -1 && b > a) { try { return JSON.parse(cleaned.slice(a, b + 1)); } catch {} }
  return null;
}
