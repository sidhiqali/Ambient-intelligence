"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, P } from "@/lib/icons";
import { useStore } from "@/lib/store";
import { DEFAULT_TRANSCRIPT } from "@/lib/seed";
import { analyzeHeuristic } from "@/lib/analysis";
import { visionGroups, visionAnalysis, getVisionType } from "@/lib/vision";
import { LiveVoiceAgent } from "@/components/voiceAgent";
import { EmergencyAlert } from "@/components/emergency";
import { computePriority, PRIORITY_META } from "@/lib/priority";
import { Analysis, CheckinMode } from "@/lib/types";

type Step = "mode" | "capture" | "analyzing" | "followup" | "complete" | "unclear" | "emergency";

const MODES: { id: CheckinMode; label: string; sub: string; icon: string }[] = [
  { id: "call", label: "Daily call", sub: "We call and ask · hands-free", icon: P.phone },
  { id: "voice", label: "Voice", sub: "Speak naturally · ~20s", icon: P.mic },
  { id: "video", label: "Video", sub: "Show us how you look", icon: P.video },
  { id: "image", label: "Photo", sub: "Swelling, a reading, bloods", icon: P.camera },
  { id: "text", label: "Text", sub: "Type a few words", icon: P.text },
];

function pickMime(kind: "audio" | "video") {
  const list = kind === "audio"
    ? ["audio/webm", "audio/mp4", "audio/ogg"]
    : ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"];
  for (const m of list) { try { if ((window as any).MediaRecorder?.isTypeSupported(m)) return m; } catch {} }
  return "";
}

export default function CheckinFlow() {
  const router = useRouter();
  const { addCheckin, answerFollowUp, activePatientId, getPatient } = useStore();
  const firstName = getPatient(activePatientId)?.name.split(" ")[0] || "there";

  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<CheckinMode>("call");
  const [transcript, setTranscript] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [visionKey, setVisionKey] = useState<string | undefined>();
  const [checkinId, setCheckinId] = useState<string>("");
  const [followWhy, setFollowWhy] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const priority = analysis ? computePriority(analysis.flags).priority : "High";
  const meta = PRIORITY_META[priority];

  const runAnalyze = async (t: string, img?: string, vKey?: string) => {
    setStep("analyzing");
    setError(null);
    let result: Analysis;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: t, imageDataUrl: img, mode, visionType: vKey }),
      });
      result = await res.json();
      if (!result?.summary) throw new Error("bad response");
    } catch {
      result = vKey ? visionAnalysis(vKey) : analyzeHeuristic(t, { hasImage: !!img });
    }
    setAnalysis(result);
    if (result.unclear) { setTimeout(() => setStep("unclear"), 650); return; } // don't save — offer retry
    const id = "ci_" + Math.abs(hash(t + Date.now())).toString(36);
    setCheckinId(id);
    const pr = computePriority(result.flags).priority;
    addCheckin(activePatientId, {
      id, when: "Today", mode, transcript: t, imageDataUrl: img,
      analysis: result, priority: pr,
    });
    // High → emergency guidance; otherwise the normal follow-up
    setTimeout(() => setStep(pr === "High" ? "emergency" : "followup"), 650);
  };

  return (
    <div className="fade-in">
      {step === "mode" && <ModeSelect mode={mode} setMode={setMode} onNext={() => { setVisionKey(undefined); setStep("capture"); }} />}

      {step === "capture" && mode === "call" && (
        <CallCapture onBack={() => setStep("mode")} onTranscript={(t) => { setTranscript(t); runAnalyze(t); }} setError={setError} error={error} />
      )}
      {step === "capture" && mode === "text" && (
        <TextCapture value={transcript} setValue={setTranscript} onBack={() => setStep("mode")} onSubmit={() => runAnalyze(transcript)} />
      )}
      {step === "capture" && mode === "voice" && (
        <LiveVoiceAgent firstName={firstName} onBack={() => setStep("mode")} onComplete={(t) => { setTranscript(t); runAnalyze(t); }} />
      )}
      {step === "capture" && mode === "video" && !visionKey && (
        <VisionComposer input="video" onBack={() => setStep("mode")} onPick={setVisionKey} />
      )}
      {step === "capture" && mode === "video" && visionKey && (
        <VideoCapture visionKey={visionKey} onBack={() => setVisionKey(undefined)} onDone={(t, img) => { setImageDataUrl(img); const cap = getVisionType(visionKey)?.label || ""; const full = [cap, t].filter(Boolean).join(": "); setTranscript(full); runAnalyze(full, img, visionKey); }} setError={setError} error={error} />
      )}
      {step === "capture" && mode === "image" && !visionKey && (
        <VisionComposer input="image" onBack={() => setStep("mode")} onPick={setVisionKey} />
      )}
      {step === "capture" && mode === "image" && visionKey && (
        <ImageCapture visionKey={visionKey} onBack={() => setVisionKey(undefined)} onDone={(img, caption) => { setImageDataUrl(img); const cap = getVisionType(visionKey)?.label || ""; const full = [cap, caption].filter(Boolean).join(": "); setTranscript(full); runAnalyze(full, img, visionKey); }} />
      )}

      {step === "analyzing" && <Analyzing mode={mode} />}

      {step === "unclear" && (
        <UnclearRetry
          onRetry={() => { setVisionKey(undefined); setAnswered(false); setTranscript(""); setImageDataUrl(undefined); setStep("mode"); }}
          onHome={() => router.push("/patient")}
        />
      )}

      {step === "emergency" && (
        <EmergencyAlert onContinue={() => setStep("complete")} onHome={() => router.push("/patient")} />
      )}

      {step === "followup" && analysis && (
        <FollowUp
          analysis={analysis}
          followWhy={followWhy}
          setFollowWhy={setFollowWhy}
          answered={answered}
          answerText={answerText}
          onAnswer={(txt) => { setAnswerText(txt); setAnswered(true); answerFollowUp(activePatientId, checkinId, txt); }}
          onContinue={() => setStep("complete")}
        />
      )}

      {step === "complete" && analysis && (
        <Complete analysis={analysis} priority={priority} meta={meta} onHome={() => router.push("/patient")} onHistory={() => router.push("/patient/history")} onClinician={() => router.push(`/clinician/patient/${activePatientId}`)} />
      )}
    </div>
  );
}

/* ---------------- mode select ---------------- */
function ModeSelect({ mode, setMode, onNext }: any) {
  const call = MODES.find((m) => m.id === "call")!;
  const rest = MODES.filter((m) => m.id !== "call");
  const callActive = mode === "call";
  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>How would you like to check in?</h1>
      <p style={{ fontSize: 15, color: "var(--soft)", margin: "0 0 22px" }}>Every option updates the same evolving picture your care team sees. Pick whatever&rsquo;s easiest right now.</p>

      {/* featured: daily call */}
      <button onClick={() => setMode("call")} className="hover-lift press"
        style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 16, background: callActive ? "linear-gradient(135deg,var(--teal),var(--teal-d))" : "var(--card)", border: `1.5px solid ${callActive ? "var(--teal-d)" : "var(--line)"}`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "all .12s", marginBottom: 14, boxShadow: callActive ? "0 18px 40px -20px rgba(15,124,138,.7)" : "none" }}>
        <div style={{ width: 52, height: 52, flex: "none", borderRadius: 14, background: callActive ? "rgba(255,255,255,.18)" : "var(--teal-100)", color: callActive ? "#fff" : "var(--teal-d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={call.icon} size={26} color={callActive ? "#fff" : "var(--teal-d)"} stroke={1.7} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: callActive ? "#fff" : "var(--ink)" }}>{call.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: callActive ? "rgba(255,255,255,.2)" : "var(--teal-100)", color: callActive ? "#fff" : "var(--teal-d)" }}>Automated</span>
          </div>
          <div style={{ fontSize: 13.5, color: callActive ? "rgba(255,255,255,.9)" : "var(--soft)", marginTop: 2 }}>We call once a day and ask the questions — you just answer out loud.</div>
        </div>
        <Icon d={P.chevronRight} size={20} color={callActive ? "#fff" : "var(--faint)"} stroke={1.7} />
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {rest.map((m) => {
          const active = mode === m.id;
          return (
            <button key={m.id} onClick={() => setMode(m.id)} className="hover-lift press"
              style={{ textAlign: "left", background: active ? "var(--teal-50)" : "var(--card)", border: `1.5px solid ${active ? "var(--teal)" : "var(--line)"}`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "all .12s" }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: active ? "var(--teal)" : "var(--teal-100)", color: active ? "#fff" : "var(--teal-d)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Icon d={m.icon} size={23} color={active ? "#fff" : "var(--teal-d)"} stroke={1.7} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{m.label}</div>
              <div style={{ fontSize: 13, color: "var(--soft)", marginTop: 2 }}>{m.sub}</div>
            </button>
          );
        })}
      </div>
      <button onClick={onNext} className="btn-teal press" style={{ width: "100%", padding: 16, fontSize: 16, marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
        Continue with {MODES.find((m) => m.id === mode)?.label} <Icon d={P.arrowRight} size={18} color="#fff" stroke={1.9} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center", marginTop: 16, color: "var(--soft)" }}>
        <Icon d={P.shield} size={15} color="var(--soft)" stroke={1.6} />
        <span style={{ fontSize: 13 }}>Nothing is shared unless you allow it. You can stop at any time.</span>
      </div>
    </div>
  );
}

/* ---------------- vision composition ---------------- */
function VisionComposer({ input, onBack, onPick }: { input: "image" | "video"; onBack: () => void; onPick: (key: string) => void }) {
  const groups = visionGroups(input);
  return (
    <div className="fade-in">
      <BackRow onBack={onBack} title={input === "image" ? "AI photo analysis" : "AI video analysis"} />
      <p style={{ fontSize: 14.5, color: "var(--soft)", margin: "-6px 0 18px" }}>
        Choose what to {input === "image" ? "photograph" : "record"}. Our AI reads it for the matching biomarkers and shares the result with your care team.
      </p>
      {groups.map((g) => (
        <div key={g.group} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: "var(--teal-100)", color: "var(--teal-d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon d={g.icon} size={15} color="var(--teal-d)" stroke={1.7} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--teal-d)", textTransform: "uppercase", letterSpacing: ".05em" }}>{g.group}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {g.types.map((t) => (
              <button key={t.key} onClick={() => onPick(t.key)} className="hover-lift press"
                style={{ textAlign: "left", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 13, padding: 14, cursor: "pointer" }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 3 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: "var(--soft)", lineHeight: 1.4 }}>{t.biomarker}</div>
                <span style={{ display: "inline-block", marginTop: 8, fontSize: 10.5, fontWeight: 700, color: "var(--teal-d)", background: "var(--teal-50)", border: "1px solid var(--teal-100)", padding: "2px 8px", borderRadius: 20 }}>{t.disease}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- text ---------------- */
function TextCapture({ value, setValue, onBack, onSubmit }: any) {
  return (
    <div className="fade-in">
      <BackRow onBack={onBack} title="Type your check-in" />
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--teal)", marginBottom: 10 }}>How have you been since last time?</div>
        <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={5} autoFocus
          placeholder="Tell us how you've been since your last check-in — your energy, breathing, sleep, or anything new…"
          style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 12, padding: 14, fontSize: 16, lineHeight: 1.5, color: "var(--ink)", resize: "vertical", outlineColor: "var(--teal)" }} />
      </div>
      <button onClick={onSubmit} disabled={!value.trim()} className="btn-teal press" style={{ width: "100%", padding: 16, fontSize: 16, marginTop: 16, opacity: value.trim() ? 1 : 0.5 }}>
        Analyze my check-in
      </button>
    </div>
  );
}

/* ---------------- voice ---------------- */
function VoiceCapture({ onBack, onTranscript, setError, error }: any) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime("audio");
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => finish(mime);
      rec.start();
      recRef.current = rec;
      setRecording(true);
      setElapsed(0);
      timer.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (e) {
      setError("Microphone unavailable — you can type your check-in instead.");
    }
  };

  const stop = () => {
    clearInterval(timer.current);
    setRecording(false);
    try { recRef.current?.stop(); } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const finish = async (mime: string) => {
    setBusy(true);
    try {
      const blob = new Blob(chunks.current, { type: mime || "audio/webm" });
      const fd = new FormData();
      fd.append("file", blob, "checkin.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      onTranscript(data.text || "");
    } catch {
      onTranscript("");
    }
  };

  useEffect(() => () => { clearInterval(timer.current); streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  return (
    <div className="fade-in">
      <BackRow onBack={onBack} title="Voice check-in" />
      <div style={{ background: "linear-gradient(180deg,#0d5560,#0a4550)", borderRadius: 20, padding: "26px 24px", minHeight: 380, display: "flex", flexDirection: "column", boxShadow: "0 24px 50px -24px rgba(10,69,80,.7)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 20 }}>
            <Icon d={P.shield} size={13} color="#fff" stroke={1.8} /> Raw audio not retained
          </div>
          {recording && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#fff", fontSize: 13, fontWeight: 600 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff6b5e", animation: "pulse 1.4s infinite" }} /> Recording · 0:{String(elapsed).padStart(2, "0")}
            </div>
          )}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
          <div style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.65)", marginBottom: 7 }}>Ambient Intelligence</div>
            <div style={{ fontSize: 19, lineHeight: 1.4, color: "#fff", fontWeight: 400 }}>&ldquo;Hi Sarah. How have you been feeling since our last check-in?&rdquo;</div>
          </div>
          <Waveform active={recording} />
          {busy && <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff", justifyContent: "center" }}><span className="spinner" style={{ borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff" }} /> Transcribing your voice…</div>}
        </div>

        {error && <div style={{ color: "#fff", background: "rgba(255,107,94,.2)", borderRadius: 10, padding: "10px 12px", fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 12 }}>
          {!recording && !busy && (
            <button onClick={start} style={{ flex: 1, background: "#fff", color: "var(--teal-d)", border: "none", borderRadius: 13, padding: 16, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
              <Icon d={P.mic} size={20} color="var(--teal-d)" stroke={1.8} /> {elapsed ? "Record again" : "Start speaking"}
            </button>
          )}
          {recording && (
            <button onClick={stop} style={{ flex: 1, background: "#fff", color: "var(--teal-d)", border: "none", borderRadius: 13, padding: 16, fontSize: 16, fontWeight: 700 }}>
              End check-in
            </button>
          )}
        </div>
      </div>
      <TypeInsteadHint onType={() => onTranscript(DEFAULT_TRANSCRIPT)} />
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 40 });
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, height: 90 }}>
      {bars.map((_, i) => (
        <span key={i} style={{
          width: 4, height: 64, borderRadius: 3, background: "rgba(255,255,255,.85)", transformOrigin: "center",
          animation: active ? "wave 1.1s ease-in-out infinite" : "none",
          transform: active ? undefined : "scaleY(.18)",
          animationDelay: `${(Math.sin(i * 1.3) * 0.4 - 0.6).toFixed(2)}s`,
          opacity: active ? 1 : 0.4,
        }} />
      ))}
    </div>
  );
}

/* ---------------- call (AI-initiated) ---------------- */
const CALL_GREETING = "Hi Sarah, it's your daily check-in from Ambient Intelligence. How have you been feeling since yesterday — any change in your energy, walking, or breathing?";

function CallCapture({ onBack, onTranscript, setError, error }: any) {
  const [phase, setPhase] = useState<"ringing" | "connected" | "listening" | "processing">("ringing");
  const [elapsed, setElapsed] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const callTimer = useRef<any>(null);

  const speak = (text: string) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1; u.pitch = 1;
      synth.speak(u);
    } catch {}
  };

  const answer = async () => {
    setPhase("connected");
    callTimer.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    speak(CALL_GREETING);
  };

  const startListening = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime("audio");
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => finish(mime);
      rec.start();
      recRef.current = rec;
      try { window.speechSynthesis?.cancel(); } catch {}
      setPhase("listening");
    } catch {
      setError("Microphone unavailable — you can use the example answer instead.");
    }
  };

  const stopListening = () => {
    setPhase("processing");
    try { recRef.current?.stop(); } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const finish = async (mime: string) => {
    try {
      const blob = new Blob(chunks.current, { type: mime || "audio/webm" });
      const fd = new FormData();
      fd.append("file", blob, "call.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      onTranscript(data.text || DEFAULT_TRANSCRIPT);
    } catch {
      onTranscript(DEFAULT_TRANSCRIPT);
    }
  };

  useEffect(() => () => { clearInterval(callTimer.current); streamRef.current?.getTracks().forEach((t) => t.stop()); try { window.speechSynthesis?.cancel(); } catch {} }, []);

  return (
    <div className="fade-in">
      <BackRow onBack={onBack} title="Daily check-in call" />
      <div style={{ background: "linear-gradient(180deg,#0d5560,#0a4550)", borderRadius: 24, padding: "36px 24px 26px", minHeight: 460, display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 24px 50px -24px rgba(10,69,80,.7)" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.6)" }}>
          {phase === "ringing" ? "Incoming call" : `Connected · 0:${String(elapsed).padStart(2, "0")}`}
        </div>
        <div style={{ position: "relative", marginTop: 24, marginBottom: 18 }}>
          {phase !== "ringing" && <span style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "2px solid rgba(255,255,255,.25)", animation: "pulse 1.8s infinite" }} />}
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.2)" }}>
            <Icon d={P.logo} size={44} color="#fff" stroke={1.8} />
          </div>
        </div>
        <div style={{ fontSize: 21, fontWeight: 600, color: "#fff", fontFamily: "var(--font-heading)" }}>Ambient Intelligence</div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.7)", marginTop: 3 }}>Automated daily monitoring · voice via AssemblyAI</div>

        {/* AI question / status */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", width: "100%" }}>
          {phase === "connected" && (
            <div style={{ width: "100%", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.65)", marginBottom: 8 }}>
                <Icon d={P.speaker} size={15} color="rgba(255,255,255,.8)" stroke={1.7} /> Asking
              </div>
              <div style={{ fontSize: 18, lineHeight: 1.45, color: "#fff" }}>&ldquo;{CALL_GREETING}&rdquo;</div>
            </div>
          )}
          {phase === "listening" && <Waveform active={true} />}
          {phase === "processing" && (
            <div style={{ margin: "0 auto", display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
              <span className="spinner" style={{ borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff" }} /> Transcribing your answer…
            </div>
          )}
        </div>

        {error && <div style={{ color: "#fff", background: "rgba(255,107,94,.2)", borderRadius: 10, padding: "10px 12px", fontSize: 13, marginBottom: 12, width: "100%" }}>{error}</div>}

        {/* controls */}
        <div style={{ width: "100%" }}>
          {phase === "ringing" && (
            <button onClick={answer} className="press" style={{ width: "100%", background: "var(--green)", color: "#fff", border: "none", borderRadius: 14, padding: 17, fontSize: 16.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Icon d={P.phone} size={20} color="#fff" stroke={1.9} /> Answer call
            </button>
          )}
          {phase === "connected" && (
            <button onClick={startListening} className="press" style={{ width: "100%", background: "#fff", color: "var(--teal-d)", border: "none", borderRadius: 14, padding: 17, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
              <Icon d={P.mic} size={20} color="var(--teal-d)" stroke={1.8} /> Hold to answer — tap to start
            </button>
          )}
          {phase === "listening" && (
            <button onClick={stopListening} className="press" style={{ width: "100%", background: "#fff", color: "var(--teal-d)", border: "none", borderRadius: 14, padding: 17, fontSize: 16, fontWeight: 700 }}>
              I&rsquo;m done answering
            </button>
          )}
        </div>
      </div>
      <TypeInsteadHint onType={() => onTranscript(DEFAULT_TRANSCRIPT)} />
    </div>
  );
}

/* ---------------- video ---------------- */
function VideoCapture({ onBack, onDone, setError, error, visionKey }: any) {
  const vt = getVisionType(visionKey);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timer = useRef<any>(null);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      const mime = pickMime("video");
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => finish(mime);
      rec.start();
      recRef.current = rec;
      setRecording(true);
      setElapsed(0);
      timer.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      setError("Camera unavailable — try Photo or Text instead.");
    }
  };

  const grabFrame = (): string | undefined => {
    try {
      const v = videoRef.current; if (!v) return;
      const c = document.createElement("canvas");
      c.width = v.videoWidth || 480; c.height = v.videoHeight || 360;
      c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", 0.8);
    } catch { return undefined; }
  };

  const stop = () => {
    clearInterval(timer.current);
    setRecording(false);
    (recRef.current as any)._frame = grabFrame();
    try { recRef.current?.stop(); } catch {}
  };

  const finish = async (mime: string) => {
    setBusy(true);
    const frame = (recRef.current as any)?._frame;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const blob = new Blob(chunks.current, { type: mime || "video/webm" });
      const fd = new FormData();
      fd.append("file", blob, "checkin.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      onDone(data.text || "", frame);
    } catch {
      onDone("", frame);
    }
  };

  useEffect(() => () => { clearInterval(timer.current); streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  return (
    <div className="fade-in">
      <BackRow onBack={onBack} title={vt ? vt.label : "Video check-in"} />
      {vt && (
        <div style={{ display: "flex", gap: 9, background: "var(--teal-50)", border: "1px solid var(--teal-100)", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
          <Icon d={P.sparkles} size={16} color="var(--teal)" stroke={1.7} style={{ flex: "none", marginTop: 1 }} />
          <span style={{ fontSize: 13, color: "var(--teal-d)", lineHeight: 1.5 }}>We&rsquo;ll analyse for <b>{vt.biomarker}</b> ({vt.disease}). Record a short, steady clip.</span>
        </div>
      )}
      <div style={{ borderRadius: 20, overflow: "hidden", background: "#0e1417", position: "relative", minHeight: 360, boxShadow: "0 24px 50px -24px rgba(20,35,45,.6)" }}>
        <video ref={videoRef} muted playsInline style={{ width: "100%", height: 360, objectFit: "cover", display: "block", background: "#0e1417" }} />
        {!recording && !busy && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "#fff", background: "rgba(14,20,23,.55)" }}>
            <Icon d={P.video} size={40} color="#fff" stroke={1.4} />
            <div style={{ fontSize: 15, opacity: 0.9, maxWidth: 300, textAlign: "center" }}>Record a short clip — we&rsquo;ll transcribe what you say and note how you look.</div>
          </div>
        )}
        {recording && (
          <div style={{ position: "absolute", top: 14, left: 14, display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(0,0,0,.45)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "6px 12px", borderRadius: 20 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff6b5e", animation: "pulse 1.4s infinite" }} /> 0:{String(elapsed).padStart(2, "0")}
          </div>
        )}
        {busy && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#fff", background: "rgba(14,20,23,.6)" }}>
            <span className="spinner" style={{ borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff" }} /> Analyzing your clip…
          </div>
        )}
      </div>
      {error && <div style={{ color: "var(--red-d)", background: "var(--red-100)", borderRadius: 10, padding: "10px 12px", fontSize: 13, marginTop: 12 }}>{error}</div>}
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        {!recording && !busy && (
          <button onClick={start} className="btn-teal press" style={{ flex: 1, padding: 16, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
            <Icon d={P.video} size={20} color="#fff" stroke={1.8} /> Start recording
          </button>
        )}
        {recording && (
          <button onClick={stop} className="btn-teal press" style={{ flex: 1, padding: 16, fontSize: 16 }}>Stop &amp; analyze</button>
        )}
      </div>
      <TypeInsteadHint onType={() => onDone(DEFAULT_TRANSCRIPT, undefined)} />
    </div>
  );
}

/* ---------------- image ---------------- */
function ImageCapture({ onBack, onDone, visionKey }: any) {
  const vt = getVisionType(visionKey);
  const [img, setImg] = useState<string | undefined>();
  const [caption, setCaption] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pick = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => downscale(reader.result as string, (small) => setImg(small));
    reader.readAsDataURL(file);
  };

  return (
    <div className="fade-in">
      <BackRow onBack={onBack} title={vt ? vt.label : "Photo check-in"} />
      {vt && (
        <div style={{ display: "flex", gap: 9, background: "var(--teal-50)", border: "1px solid var(--teal-100)", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
          <Icon d={P.sparkles} size={16} color="var(--teal)" stroke={1.7} style={{ flex: "none", marginTop: 1 }} />
          <span style={{ fontSize: 13, color: "var(--teal-d)", lineHeight: 1.5 }}>We&rsquo;ll analyse for <b>{vt.biomarker}</b> ({vt.disease}). Take a clear, well-lit photo.</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => pick(e.target.files?.[0])} />
      {!img ? (
        <button onClick={() => inputRef.current?.click()} className="hover-lift"
          style={{ width: "100%", border: "2px dashed var(--line)", background: "var(--card)", borderRadius: 18, padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, cursor: "pointer" }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--teal-100)", color: "var(--teal-d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={P.camera} size={30} color="var(--teal-d)" stroke={1.6} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Take or upload a photo</div>
          <div style={{ fontSize: 13.5, color: "var(--soft)", textAlign: "center", maxWidth: 320 }}>A photo of ankle swelling, a home monitor reading, a rash, or a blood-test result. Our AI reads it and adds context for your care team.</div>
        </button>
      ) : (
        <div className="card" style={{ padding: 14 }}>
          <img src={img} alt="check-in" style={{ width: "100%", borderRadius: 12, maxHeight: 360, objectFit: "cover" }} />
          <button onClick={() => inputRef.current?.click()} className="btn-ghost" style={{ width: "100%", padding: 11, marginTop: 12, fontSize: 14 }}>Choose a different photo</button>
        </div>
      )}
      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--teal)", marginBottom: 8 }}>Add a note (optional)</div>
        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. my ankles look more swollen than usual"
          style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", fontSize: 15, outlineColor: "var(--teal)" }} />
      </div>
      <button onClick={() => onDone(img, caption)} disabled={!img} className="btn-teal press" style={{ width: "100%", padding: 16, fontSize: 16, marginTop: 16, opacity: img ? 1 : 0.5 }}>
        Analyze photo
      </button>
    </div>
  );
}

/* ---------------- analyzing ---------------- */
function Analyzing({ mode }: { mode: CheckinMode }) {
  const lines = ["Understanding what you shared", "Comparing with your personal baseline", "Identifying what changed", "Preparing one focused follow-up"];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((v) => Math.min(v + 1, lines.length - 1)), 550); return () => clearInterval(t); }, []);
  return (
    <div className="fade-in" style={{ minHeight: 420, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{ position: "relative", width: 84, height: 84, marginBottom: 24 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--teal-100)", animation: "pulse 1.8s infinite" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={P.sparkles} size={38} color="var(--teal-d)" stroke={1.6} />
        </div>
      </div>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Thinking it through…</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
        {lines.map((l, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: idx <= i ? "var(--ink)" : "var(--faint)", transition: "color .3s" }}>
            {idx < i ? <Icon d={P.check} size={17} color="var(--green-d)" stroke={2} /> : idx === i ? <span className="spinner" /> : <span style={{ width: 17, height: 17, borderRadius: "50%", border: "2px solid var(--line)" }} />}
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- unclear / retry ---------------- */
function UnclearRetry({ onRetry, onHome }: { onRetry: () => void; onHome: () => void }) {
  return (
    <div className="fade-in" style={{ minHeight: 440, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{ width: 78, height: 78, borderRadius: "50%", background: "var(--amber-100)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Icon d={P.alertCircle} size={38} color="var(--amber-d)" stroke={1.7} />
      </div>
      <h1 style={{ fontSize: 26, marginBottom: 12 }}>We couldn&rsquo;t capture clear information</h1>
      <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "var(--soft)", margin: "0 0 26px", maxWidth: 420 }}>
        Nothing was added to your record. That&rsquo;s no problem — let&rsquo;s try again, or pick a different way to check in.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 11, width: "100%", maxWidth: 340 }}>
        <button onClick={onRetry} className="btn-teal press" style={{ width: "100%", padding: 16, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
          <Icon d={P.refresh} size={18} color="#fff" stroke={1.9} /> Try the check-in again
        </button>
        <button onClick={onHome} className="btn-ghost press" style={{ width: "100%", padding: 15, fontSize: 15 }}>Not now — back home</button>
      </div>
    </div>
  );
}

/* ---------------- follow up ---------------- */
function FollowUp({ analysis, followWhy, setFollowWhy, answered, answerText, onAnswer, onContinue }: any) {
  return (
    <div className="fade-in" style={{ minHeight: 460, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, alignSelf: "flex-start", background: "var(--teal-100)", color: "var(--teal-d)", fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 20, marginBottom: 18 }}>
        <Icon d={P.sparkles} size={14} color="var(--teal-d)" stroke={1.7} /> Based on your previous check-ins
      </div>
      <div style={{ background: "var(--teal-50)", border: "1px solid var(--teal-100)", borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--teal)", marginBottom: 8 }}>Ambient Intelligence</div>
        <div style={{ fontSize: 20, lineHeight: 1.42, fontWeight: 400, color: "var(--ink)" }}>&ldquo;{analysis.followUpQuestion}&rdquo;</div>
      </div>

      <button onClick={() => setFollowWhy(!followWhy)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: "14px 2px", fontSize: 14, fontWeight: 600, color: "var(--teal-d)", textAlign: "left" }}>
        <Icon d={P.chevronRight} size={16} color="currentColor" stroke={1.7} style={{ transition: "transform .18s", transform: `rotate(${followWhy ? 90 : 0}deg)` }} /> Why am I being asked this?
      </button>
      {followWhy && (
        <div className="wash fade-up" style={{ borderRadius: 12, padding: "14px 16px", fontSize: 14, lineHeight: 1.5, color: "var(--soft)" }}>
          Understanding this detail helps your care team decide how quickly to review the change — it narrows the picture without a clinic visit.
        </div>
      )}

      {!answered ? (
        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          <div style={{ fontSize: 13, color: "var(--soft)", textAlign: "center", marginBottom: 14, fontWeight: 500 }}>Answer by voice, or type your reply</div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => onAnswer("Only when I'm moving around. I'm fine when I'm sitting.")} className="btn-teal press" style={{ flex: 1, padding: 15, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon d={P.mic} size={18} color="#fff" stroke={1.7} /> Answer by voice
            </button>
            <button onClick={() => onAnswer("Only when I'm moving around. I'm fine when I'm sitting.")} className="btn-ghost press" style={{ flex: 1, padding: 15, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon d={P.text} size={18} color="var(--teal-d)" stroke={1.7} /> Type reply
            </button>
          </div>
        </div>
      ) : (
        <div className="fade-up" style={{ marginTop: "auto", paddingTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}><span style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600 }}>Your answer</span></div>
          <div style={{ background: "var(--teal)", color: "#fff", borderRadius: "16px 16px 4px 16px", padding: "16px 18px", fontSize: 16.5, lineHeight: 1.45, marginLeft: 40 }}>&ldquo;{answerText}&rdquo;</div>
          <button onClick={onContinue} className="btn-teal press" style={{ width: "100%", marginTop: 20, padding: 16, fontSize: 16 }}>Continue</button>
        </div>
      )}
    </div>
  );
}

/* ---------------- complete ---------------- */
function Complete({ analysis, priority, meta, onHome, onHistory, onClinician }: any) {
  const rows = [
    { label: "Follow-up questions answered", value: "1", color: "var(--ink)" },
    { label: "Change identified", value: analysis.changes[0] || "Noted", color: "var(--ink)" },
    { label: "Next check-in", value: priority === "High" ? "Tomorrow" : "In one week", color: "var(--ink)" },
    { label: "Current plan", value: priority === "High" ? "Care-team review requested" : priority === "Medium" ? "Follow-up requested" : "Continue monitoring", color: meta.fg },
  ];
  return (
    <div className="fade-in" style={{ minHeight: 460, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: 8 }}>
        <div style={{ width: 78, height: 78, borderRadius: "50%", background: "var(--green-100)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, animation: "fadeUp .3s" }}>
          <Icon d={P.check} size={40} color="var(--green-d)" stroke={1.8} />
        </div>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Check-in completed</h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "var(--soft)", margin: "0 0 24px", maxWidth: 440 }}>
          We&rsquo;ve added today&rsquo;s changes to your health timeline and shared the relevant information with your care team.
        </p>
      </div>

      {analysis.patientMessage && (
        <div className="card" style={{ padding: 18, marginBottom: 14, background: "linear-gradient(180deg,var(--teal-50),var(--card))", borderColor: "var(--teal-100)" }}>
          <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>{analysis.patientMessage}</p>
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 17px", borderTop: i ? "1px solid var(--line2)" : "none" }}>
            <span style={{ fontSize: 14.5, color: "var(--soft)" }}>{r.label}</span>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: r.color }}>{r.value}</span>
          </div>
        ))}
      </div>

      <div className="wash" style={{ display: "flex", gap: 10, borderRadius: 13, padding: "14px 15px", marginTop: 16 }}>
        <Icon d={P.alertTri} size={18} color="var(--soft)" stroke={1.6} style={{ flex: "none", marginTop: 1 }} />
        <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--soft)" }}>If your symptoms suddenly become severe or you believe you need urgent help, use the emergency guidance provided by your care service.</span>
      </div>

      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 11 }}>
        <button onClick={onHome} className="btn-teal press" style={{ width: "100%", padding: 16, fontSize: 16 }}>Return home</button>
        <button onClick={onHistory} className="btn-ghost press" style={{ width: "100%", padding: 15, fontSize: 15 }}>View my timeline</button>
        <button onClick={onClinician} style={{ width: "100%", padding: 12, fontSize: 13.5, background: "none", border: "none", color: "var(--faint)", fontWeight: 600 }}>Demo: see how your care team sees this →</button>
      </div>
    </div>
  );
}

/* ---------------- shared bits ---------------- */
function BackRow({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <button onClick={onBack} className="hover-teal" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 20, padding: "8px 13px", fontSize: 13, fontWeight: 600, color: "var(--soft)" }}>
        <Icon d={P.chevronLeft} size={15} color="currentColor" stroke={1.7} /> Back
      </button>
      <h1 style={{ fontSize: 22 }}>{title}</h1>
    </div>
  );
}

function TypeInsteadHint({ onType }: { onType: () => void }) {
  return (
    <div style={{ textAlign: "center", marginTop: 16 }}>
      <button onClick={onType} style={{ background: "none", border: "none", color: "var(--teal-d)", fontSize: 14, fontWeight: 600 }}>
        Prefer not to record? Use the example check-in →
      </button>
    </div>
  );
}

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return h; }

// Downscale to <=1024px JPEG so the vision payload stays small and reliable.
function downscale(dataUrl: string, cb: (out: string) => void) {
  try {
    const img = new Image();
    img.onload = () => {
      const max = 1024;
      let { width, height } = img;
      if (width > max || height > max) { const r = Math.min(max / width, max / height); width = Math.round(width * r); height = Math.round(height * r); }
      const c = document.createElement("canvas");
      c.width = width; c.height = height;
      c.getContext("2d")!.drawImage(img, 0, 0, width, height);
      cb(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => cb(dataUrl);
    img.src = dataUrl;
  } catch { cb(dataUrl); }
}
