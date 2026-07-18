// AssemblyAI transcription (async): upload → create transcript → poll.
// Used for the "Call" and voice modalities when ASSEMBLYAI_API_KEY is set.
// Returns null if not configured or on failure (caller falls back).

const BASE = "https://api.assemblyai.com/v2";
export const ASSEMBLY_MODEL = process.env.ASSEMBLYAI_MODEL || "universal";

export async function transcribeWithAssembly(bytes: Buffer, contentType: string): Promise<string | null> {
  const key = process.env.ASSEMBLYAI_API_KEY;
  if (!key) return null;
  try {
    const up = await fetch(`${BASE}/upload`, {
      method: "POST",
      headers: { authorization: key, "content-type": contentType || "application/octet-stream" },
      body: new Uint8Array(bytes) as any,
    });
    if (!up.ok) return null;
    const { upload_url } = await up.json();

    const created = await fetch(`${BASE}/transcript`, {
      method: "POST",
      headers: { authorization: key, "content-type": "application/json" },
      body: JSON.stringify({ audio_url: upload_url, speech_model: ASSEMBLY_MODEL }),
    });
    if (!created.ok) return null;
    const { id } = await created.json();

    // poll up to ~25s
    for (let i = 0; i < 25; i++) {
      const r = await fetch(`${BASE}/transcript/${id}`, { headers: { authorization: key } });
      const data = await r.json();
      if (data.status === "completed") return (data.text || "").trim() || null;
      if (data.status === "error") return null;
      await new Promise((res) => setTimeout(res, 1000));
    }
    return null;
  } catch {
    return null;
  }
}
