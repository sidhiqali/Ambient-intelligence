// Optional second AI provider (e.g. "runaware"/Runware) integration seam.
// Off unless SECONDARY_AI_KEY is set. When wired, it can enhance image/vision
// analysis; until then everything routes through OpenAI. Returns null = "not used".

export interface SecondaryImageResult {
  finding: string;
  provider: string;
}

export async function secondaryImageAnalyze(_imageDataUrl: string): Promise<SecondaryImageResult | null> {
  const key = process.env.SECONDARY_AI_KEY;
  if (!key) return null;
  // TODO: real endpoint once the provider + contract are confirmed.
  // const res = await fetch("https://api.runware.ai/v1/...", {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  //   body: JSON.stringify({ image: _imageDataUrl, task: "describe" }),
  // });
  // const data = await res.json();
  // return { finding: data.caption, provider: "runaware" };
  return null;
}
