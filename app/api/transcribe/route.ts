import { NextRequest, NextResponse } from "next/server";
import { getClient, TRANSCRIBE_MODEL } from "@/lib/openai";
import { transcribeWithAssembly } from "@/lib/assembly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let file: File | null = null;
  try {
    const form = await req.formData();
    file = form.get("file") as File | null;
  } catch {}

  // No audio → empty (caller treats as "unclear"), never fabricate words.
  if (!file || file.size < 500) return NextResponse.json({ text: "", source: "none" });

  // 1) AssemblyAI (preferred when configured)
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const asm = await transcribeWithAssembly(buf, file.type || "application/octet-stream");
    if (asm) return NextResponse.json({ text: asm, source: "assemblyai" });
  } catch {}

  // 2) OpenAI Whisper
  const client = getClient();
  if (client) {
    try {
      const result = await client.audio.transcriptions.create({ file, model: TRANSCRIBE_MODEL });
      const text = (result as any).text?.trim();
      if (text) return NextResponse.json({ text, source: "openai" });
    } catch {}
  }

  // 3) couldn't transcribe → empty
  return NextResponse.json({ text: "", source: "none" });
}
