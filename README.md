# Ambient Intelligence

AI-assisted chronic-care monitoring between appointments. Patients check in by **automated daily call, voice, video, photo, or text**; the AI compares against their personal baseline, asks one adaptive follow-up, and hands clinicians an explainable view of what changed and why a review was prioritised. **The clinician always makes the decision.**

Built for the eMed hackathon. Next.js (frontend + server), no auth, no database — state lives in the browser so a check-in flows straight through to the clinician view.

## Run

```bash
npm install
npm run dev
# open http://localhost:3007
```

### AI keys (optional but recommended for the live demo)
Copy `.env.local.example` → `.env.local` and add:

```
OPENAI_API_KEY=sk-...            # powers voice transcription (Whisper) + multimodal analysis (gpt-4o-mini vision)
# OPENAI_CHAT_MODEL=gpt-4o-mini
# OPENAI_TRANSCRIBE_MODEL=whisper-1
# SECONDARY_AI_KEY=...           # optional 2nd provider (runaware) — seam in lib/secondaryAI.ts
```

Without a key everything still runs — the app falls back to a scripted (but realistic) analysis, so the demo never stalls on wifi.

## Demo golden path (~90s)
1. **Patient → Start check-in** → pick Voice / Video / Photo / Text → the AI returns a summary + one adaptive follow-up → answer it → **Check-in completed**.
2. **Switch to Clinician view** (top-right) → Sarah is top of the queue as **High · Review today** with the reason.
3. Open her **clinical narrative** → what changed, live AI summary, personal-baseline evidence, explainable priority, known/resolved/missing.
4. **Review & update plan** → bump monitoring to *Daily for three days* → **Approve**.

## Check-in modalities
- **Daily call** — AI-initiated: the app "calls", speaks its question aloud (browser TTS), the patient answers by voice → transcribed by **AssemblyAI** (`speech_model: universal`).
- **Voice / Video** — patient records; audio → AssemblyAI (or Whisper) → text; video also grabs a frame for vision.
- **Photo** — image → gpt-4o-mini vision (ankle swelling, a home reading, a lab report).
- **Text** — typed.

## How the AI is wired
- `POST /api/transcribe` — audio/video blob → **AssemblyAI if `ASSEMBLYAI_API_KEY` set, else Whisper, else scripted**.
- `POST /api/analyze` — transcript (+ optional image) → gpt-4o-mini → structured JSON `{ summary, followUpQuestion, patientMessage, changes, missingInfo, imageFinding, flags }`.
- **Priority (Low / Medium / High) is decided by transparent TypeScript rules** in `lib/priority.ts` from the AI's evidence flags — the model informs, it never decides.

## Note on "real" phone calls
AssemblyAI is speech-to-text; it does not place calls. The Daily-call demo is AI-initiated **in the browser** (needs only the AssemblyAI key). A genuine outbound phone call would additionally need a telephony/voice-agent platform (Vapi / Bland.ai / Retell / Twilio), a phone number, a public webhook URL, the patient's number + consent, and a daily scheduler — out of scope for the laptop demo.

## Structure
- `app/patient/*` — patient web app (home, multimodal check-in, connected data, timeline)
- `app/clinician/*` — dashboard queue, clinical narrative, monitoring plan, analytics
- `app/api/*` — OpenAI server routes
- `lib/*` — store (context + localStorage), seed data, priority rules, prompts
- `components/*` — shells + shared UI

_Synthetic demo data throughout._
