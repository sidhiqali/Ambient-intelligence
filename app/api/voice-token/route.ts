import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mints a short-lived token for the browser to open the AssemblyAI voice-agent
// WebSocket, so the API key stays on the server. Falls back to returning the key
// directly for a local demo (the docs' "for simplicity" path) — see the warning.
export async function GET() {
  const key = process.env.ASSEMBLYAI_API_KEY;
  if (!key) return NextResponse.json({ error: "ASSEMBLYAI_API_KEY not set" }, { status: 400 });

  // Preferred: a temporary streaming token (keeps the key off the client).
  try {
    const r = await fetch("https://streaming.assemblyai.com/v3/token?expires_in_seconds=600", {
      headers: { Authorization: key },
    });
    if (r.ok) {
      const d = await r.json();
      if (d?.token) return NextResponse.json({ token: d.token, minted: true });
    }
  } catch {}

  // Demo fallback: hand the key to the browser. Fine for a private demo — ROTATE
  // the key afterwards and do NOT ship this.
  return NextResponse.json({ token: key, minted: false });
}
