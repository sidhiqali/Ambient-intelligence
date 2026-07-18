"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, P } from "@/lib/icons";
import { Toggle } from "@/components/ui";
import { useStore } from "@/lib/store";
import { analyzeHeuristic } from "@/lib/analysis";
import { computePriority, PRIORITY_META } from "@/lib/priority";
import { Analysis } from "@/lib/types";

const FREQ = [
  { label: "Every 30 seconds (demo)", v: 0.5 },
  { label: "Every 1 minute", v: 1 },
  { label: "Every 5 minutes", v: 5 },
  { label: "Daily", v: 1440 },
];

function pickMime() {
  for (const m of ["audio/webm", "audio/mp4", "audio/ogg"]) {
    try { if ((window as any).MediaRecorder?.isTypeSupported(m)) return m; } catch {}
  }
  return "";
}

function speak(text: string) {
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1; u.pitch = 1;
    s.speak(u);
  } catch {}
}

/* ---------- navbar control ---------- */
export function AutoCallControl() {
  const { autoCall, setAutoCall, startRinging } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as any)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} className="hover-teal"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, background: autoCall.enabled ? "var(--teal-50)" : "var(--card)", border: `1px solid ${autoCall.enabled ? "var(--teal)" : "var(--line)"}`, borderRadius: 20, padding: "7px 12px", fontSize: 13, fontWeight: 600, color: autoCall.enabled ? "var(--teal-d)" : "var(--soft)", transition: "all .12s" }}>
        <Icon d={P.phone} size={15} color="currentColor" stroke={1.7} />
        Auto-call
        <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: autoCall.enabled ? "var(--teal)" : "var(--line)", color: autoCall.enabled ? "#fff" : "var(--soft)" }}>{autoCall.enabled ? "On" : "Off"}</span>
      </button>

      {open && (
        <div className="fade-up" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 288, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "0 24px 50px -18px rgba(20,35,45,.35)", padding: 16, zIndex: 60 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>Automated daily call</div>
            <Toggle on={autoCall.enabled} onChange={() => setAutoCall({ enabled: !autoCall.enabled })} />
          </div>
          <p style={{ fontSize: 12.5, color: "var(--soft)", lineHeight: 1.5, margin: "0 0 14px" }}>
            We&rsquo;ll call on a schedule, ask how you&rsquo;ve been, and transcribe your answers with AssemblyAI.
          </p>

          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--soft)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Frequency</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, opacity: autoCall.enabled ? 1 : 0.5, pointerEvents: autoCall.enabled ? "auto" : "none" }}>
            {FREQ.map((f) => {
              const on = autoCall.everyMinutes === f.v;
              return (
                <button key={f.v} onClick={() => setAutoCall({ everyMinutes: f.v })} style={{ display: "flex", alignItems: "center", gap: 10, background: on ? "var(--teal-50)" : "var(--wash)", border: `1px solid ${on ? "var(--teal)" : "var(--line)"}`, borderRadius: 9, padding: "9px 11px", fontSize: 13, fontWeight: 600, color: "var(--ink)", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${on ? "var(--teal)" : "var(--neutral-400)"}`, background: on ? "var(--teal)" : "transparent", flex: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}</span>
                  {f.label}
                </button>
              );
            })}
          </div>

          <button onClick={() => { setOpen(false); startRinging(); }} className="btn-teal press" style={{ width: "100%", padding: 11, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon d={P.phone} size={16} color="#fff" stroke={1.8} /> Call me now
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- scheduler + overlay host ---------- */
export function AutoCallHost() {
  const { autoCall, callRinging, startRinging } = useStore();
  const ringRef = useRef(startRinging);
  ringRef.current = startRinging;

  useEffect(() => {
    if (!autoCall.enabled) return;
    const ms = Math.max(10, autoCall.everyMinutes * 60) * 1000;
    const id = setInterval(() => ringRef.current(), ms);
    return () => clearInterval(id);
  }, [autoCall.enabled, autoCall.everyMinutes]);

  if (!callRinging) return null;
  return <CallOverlay />;
}

/* ---------- the call ---------- */
type Phase = "ringing" | "ask" | "record" | "transcribing" | "answered" | "analyzing" | "done" | "escalated";

const MAIN_Q = "Hi Sarah, it's your daily check-in from Ambient Intelligence. How have you been feeling since yesterday — any change in your energy, walking, or breathing?";

async function postForm(fd: FormData, ms: number) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch("/api/transcribe", { method: "POST", body: fd, signal: c.signal }); return await r.json(); }
  finally { clearTimeout(t); }
}
async function postAnalyze(transcript: string, ms: number) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transcript, mode: "call" }), signal: c.signal });
    return await r.json();
  } finally { clearTimeout(t); }
}

function CallOverlay() {
  const router = useRouter();
  const { stopRinging, addCheckin, activePatientId, getPatient } = useStore();
  const firstName = getPatient(activePatientId)?.name.split(" ")[0] || "there";
  const [phase, setPhase] = useState<Phase>("ringing");
  const [turn, setTurn] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [question, setQuestion] = useState(() => `Hi ${firstName}, it's your daily check-in from Ambient Intelligence. How have you been feeling since yesterday — any change in your energy, walking, or breathing?`);
  const [answers, setAnswers] = useState<string[]>([]);
  const [heard, setHeard] = useState("");
  const [heardSource, setHeardSource] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timer = useRef<any>(null);
  const ringOsc = useRef<any>(null);
  const audioCtx = useRef<any>(null);
  const answersRef = useRef<string[]>([]);
  const turnRef = useRef(0);

  useEffect(() => {
    if (phase !== "ringing") return;
    let stop = false;
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      audioCtx.current = ctx;
      const ring = () => {
        if (stop || ctx.state === "closed") return;
        [0, 0.4].forEach((t) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.frequency.value = 440; o.connect(g); g.connect(ctx.destination);
          const s = ctx.currentTime + t;
          g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(0.15, s + 0.02);
          g.gain.setValueAtTime(0.15, s + 0.32); g.gain.linearRampToValueAtTime(0.0001, s + 0.35);
          o.start(s); o.stop(s + 0.35);
        });
      };
      ring();
      ringOsc.current = setInterval(ring, 2000);
      try { navigator.vibrate?.([300, 200, 300, 1400]); } catch {}
    } catch {}
    return () => { stop = true; clearInterval(ringOsc.current); try { navigator.vibrate?.(0); } catch {} };
  }, [phase]);

  const cleanupRing = () => {
    clearInterval(ringOsc.current);
    ringOsc.current = null;
    const ctx = audioCtx.current;
    audioCtx.current = null;
    if (ctx && ctx.state !== "closed") { try { ctx.close().catch(() => {}); } catch {} }
    try { navigator.vibrate?.(0); } catch {}
  };

  const answer = () => {
    cleanupRing();
    setPhase("ask");
    timer.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    speak(question);
  };

  const decline = () => { cleanupRing(); end(); };

  const startRecording = async () => {
    try { window.speechSynthesis?.cancel(); } catch {}
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => transcribe(mime);
      rec.start();
      recRef.current = rec;
      setPhase("record");
    } catch {
      gotAnswer("", "none");
    }
  };

  const stopRecording = () => {
    setPhase("transcribing");
    try { recRef.current?.stop(); } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const transcribe = async (mime: string) => {
    let text = "", source = "fallback";
    try {
      const blob = new Blob(chunks.current, { type: mime || "audio/webm" });
      const fd = new FormData();
      fd.append("file", blob, "call.webm");
      const data = await postForm(fd, 35000);
      text = (data.text || "").trim();
      source = data.source || "none";
    } catch {}
    gotAnswer(text, source);
  };

  // show the transcript to the patient (proof it heard them), then analyze
  const gotAnswer = (text: string, source: string) => {
    const parts = [...answersRef.current, text];
    answersRef.current = parts;
    setAnswers(parts);
    setHeard(text);
    setHeardSource(source);
    setPhase("answered");
    setTimeout(() => runAnalyze(parts.join(" ")), 1600);
  };

  const runAnalyze = async (fullTranscript: string) => {
    setPhase("analyzing");
    let result: Analysis = analyzeHeuristic(fullTranscript);
    try { const j = await postAnalyze(fullTranscript, 25000); if (j?.summary) result = j; } catch {}
    // Demo: a call always escalates to High for clinician review as a safety precaution.
    const escalated: Analysis = {
      ...result, unclear: false,
      summary: "This check-in call has been escalated to High for clinician review as a safety precaution.",
      patientMessage: "If you're not feeling well, I'll flag this as high and arrange for a clinician to reach you.",
      changes: !result.unclear && result.changes?.length ? result.changes : ["Escalated to High from call"],
      flags: { ...result.flags, functionalDeclineFromBaseline: true, worseningTrend: true, newExertionalSymptom: true },
    };
    setAnalysis(escalated);
    const eid = "call_" + Math.abs(hash(fullTranscript + elapsed + "esc")).toString(36);
    addCheckin(activePatientId, { id: eid, when: "Today", mode: "call", transcript: fullTranscript || "(call)", analysis: escalated, priority: "High" });
    speak(escalated.patientMessage);
    setPhase("escalated");
  };

  const retry = () => {
    answersRef.current = [];
    setAnswers([]); setHeard(""); setHeardSource(""); setAnalysis(null);
    setPhase("ask");
    speak(question);
  };

  const end = () => {
    clearInterval(timer.current);
    cleanupRing();
    try { window.speechSynthesis?.cancel(); } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    stopRinging();
  };

  useEffect(() => () => { clearInterval(timer.current); cleanupRing(); streamRef.current?.getTracks().forEach((t) => t.stop()); try { window.speechSynthesis?.cancel(); } catch {} }, []);

  const priority = analysis ? computePriority(analysis.flags).priority : "High";
  const meta = PRIORITY_META[priority];
  const showQ = phase === "ask" || phase === "record" || phase === "transcribing" || phase === "answered" || phase === "analyzing";
  const srcLabel = heardSource === "assemblyai" ? "Transcribed by AssemblyAI" : heardSource === "openai" ? "Transcribed by Whisper" : heardSource === "example" ? "Example answer" : "Transcribed";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "linear-gradient(180deg,#0d5560,#082f37)", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 22px", animation: "fadeIn .25s" }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.6)" }}>
        {phase === "ringing" ? "Incoming call" : phase === "done" ? "Call ending" : `Connected · 0:${String(elapsed).padStart(2, "0")}`}
      </div>

      <div style={{ position: "relative", marginTop: 34, marginBottom: 16 }}>
        <span style={{ position: "absolute", inset: -10, borderRadius: "50%", border: "2px solid rgba(255,255,255,.22)", animation: "pulse 1.8s infinite" }} />
        {phase === "ringing" && <span style={{ position: "absolute", inset: -22, borderRadius: "50%", border: "2px solid rgba(255,255,255,.12)", animation: "pulse 1.8s infinite" }} />}
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={P.logo} size={46} color="#fff" stroke={1.8} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: "#fff", fontFamily: "var(--font-heading)" }}>Ambient Intelligence</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 3 }}>Automated daily monitoring · voice via AssemblyAI</div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", width: "100%", maxWidth: 560 }}>
        <div style={{ width: "100%" }}>
          {showQ && (
            <div style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.65)", marginBottom: 7 }}>
                <Icon d={phase === "record" ? P.mic : P.speaker} size={15} color="rgba(255,255,255,.85)" stroke={1.7} /> {phase === "record" ? "Listening" : `Asking${turn === 1 ? " · follow-up" : ""}`}
              </div>
              <div style={{ fontSize: 17, lineHeight: 1.45, color: "#fff" }}>&ldquo;{question}&rdquo;</div>
            </div>
          )}

          {phase === "record" && <Bars />}

          {phase === "transcribing" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff", justifyContent: "center", padding: 10 }}>
              <span className="spinner" style={{ borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff" }} /> Transcribing your answer with AssemblyAI…
            </div>
          )}

          {(phase === "answered" || phase === "analyzing") && (
            <div className="fade-up">
              {heard ? (
                <>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>{srcLabel}</span>
                  </div>
                  <div style={{ background: "#fff", color: "var(--teal-d)", borderRadius: "16px 16px 4px 16px", padding: "15px 18px", fontSize: 16.5, lineHeight: 1.45, marginLeft: 40, fontWeight: 500 }}>&ldquo;{heard}&rdquo;</div>
                </>
              ) : (
                <div style={{ textAlign: "center", color: "rgba(255,255,255,.78)", fontSize: 15 }}>Thanks — reviewing how you&rsquo;re doing…</div>
              )}
              {phase === "analyzing" && (
                <div style={{ display: "flex", alignItems: "center", gap: 9, color: "rgba(255,255,255,.85)", justifyContent: "center", marginTop: 16 }}>
                  <span className="spinner" style={{ borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff", width: 16, height: 16 }} /> Understanding &amp; updating your record…
                </div>
              )}
            </div>
          )}

          {phase === "done" && analysis && !analysis.unclear && (
            <div className="fade-up" style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, padding: 22, textAlign: "center" }}>
              <div style={{ width: 58, height: 58, borderRadius: "50%", background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Icon d={P.check} size={28} color="#fff" stroke={2} />
              </div>
              <div style={{ fontSize: 19, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Check-in saved</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,.85)", lineHeight: 1.5, margin: "0 0 14px" }}>{analysis.patientMessage}</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, background: "rgba(255,255,255,.15)", color: "#fff", padding: "5px 12px", borderRadius: 20 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.accent }} /> Priority: {priority} · shared with care team
              </span>
            </div>
          )}
          {phase === "done" && analysis && analysis.unclear && (
            <div className="fade-up" style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,180,90,.35)", borderRadius: 16, padding: 22, textAlign: "center" }}>
              <div style={{ width: 58, height: 58, borderRadius: "50%", background: "rgba(255,180,90,.22)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Icon d={P.alertCircle} size={28} color="#ffce8a" stroke={2} />
              </div>
              <div style={{ fontSize: 19, fontWeight: 600, color: "#fff", marginBottom: 8 }}>I didn&rsquo;t catch enough</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,.85)", lineHeight: 1.5, margin: 0 }}>No clear information came through, so nothing was added to your record. Shall we try again?</p>
            </div>
          )}
          {phase === "escalated" && analysis && (
            <div className="fade-up" style={{ background: "rgba(255,120,90,.12)", border: "1px solid rgba(255,150,110,.4)", borderRadius: 16, padding: 22, textAlign: "center" }}>
              <div style={{ width: 58, height: 58, borderRadius: "50%", background: "rgba(255,120,90,.22)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Icon d={P.alertCircle} size={28} color="#ffb199" stroke={2} />
              </div>
              <div style={{ fontSize: 19, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Flagged as High</div>
              <p style={{ fontSize: 14.5, color: "rgba(255,255,255,.9)", lineHeight: 1.5, margin: "0 0 12px" }}>{analysis.patientMessage}</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, background: "rgba(255,255,255,.15)", color: "#fff", padding: "5px 12px", borderRadius: 20 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red)" }} /> High · a clinician is being arranged
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 420 }}>
        {phase === "ringing" && (
          <div style={{ display: "flex", gap: 40, justifyContent: "center" }}>
            <CircleBtn color="var(--red)" icon={P.phoneEnd} label="Decline" onClick={decline} />
            <CircleBtn color="var(--green)" icon={P.phone} label="Answer" onClick={answer} pulse />
          </div>
        )}
        {phase === "ask" && (
          <button onClick={startRecording} className="press" style={{ width: "100%", background: "#fff", color: "var(--teal-d)", border: "none", borderRadius: 14, padding: 17, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
            <Icon d={P.mic} size={20} color="var(--teal-d)" stroke={1.8} /> Tap to answer
          </button>
        )}
        {phase === "record" && (
          <button onClick={stopRecording} className="press" style={{ width: "100%", background: "#fff", color: "var(--teal-d)", border: "none", borderRadius: 14, padding: 17, fontSize: 16, fontWeight: 700 }}>
            I&rsquo;m done answering
          </button>
        )}
        {phase !== "ringing" && phase !== "done" && phase !== "escalated" && (
          <button onClick={end} style={{ width: "100%", marginTop: 12, background: "transparent", color: "rgba(255,255,255,.75)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600 }}>End call</button>
        )}
        {phase === "escalated" && (
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => { end(); router.push("/patient/emergency"); }} className="press" style={{ flex: 1.5, background: "#fff", color: "var(--red-d)", border: "none", borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon d={P.alertCircle} size={18} color="var(--red-d)" stroke={2} /> See emergency guidance
            </button>
            <button onClick={retry} style={{ flex: 1, background: "transparent", color: "rgba(255,255,255,.8)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 600 }}>Try again</button>
          </div>
        )}
        {phase === "done" && !analysis?.unclear && (
          <button onClick={end} className="press" style={{ width: "100%", background: "#fff", color: "var(--teal-d)", border: "none", borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 700 }}>Done</button>
        )}
        {phase === "done" && analysis?.unclear && (
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={retry} className="press" style={{ flex: 1.4, background: "#fff", color: "var(--teal-d)", border: "none", borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon d={P.refresh} size={18} color="var(--teal-d)" stroke={1.8} /> Try again
            </button>
            <button onClick={end} style={{ flex: 1, background: "transparent", color: "rgba(255,255,255,.8)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 600 }}>Hang up</button>
          </div>
        )}
      </div>
    </div>
  );
}

function CircleBtn({ color, icon, label, onClick, pulse }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
      <button onClick={onClick} aria-label={label} className="press" style={{ width: 66, height: 66, borderRadius: "50%", background: color, border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: pulse ? `0 0 0 0 ${color}` : "none", animation: pulse ? "pulse 1.6s infinite" : "none" }}>
        <Icon d={icon} size={28} color="#fff" stroke={1.9} />
      </button>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,.85)", fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function Bars() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, height: 80 }}>
      {Array.from({ length: 36 }).map((_, i) => (
        <span key={i} style={{ width: 4, height: 60, borderRadius: 3, background: "rgba(255,255,255,.85)", transformOrigin: "center", animation: "wave 1.1s ease-in-out infinite", animationDelay: `${(Math.sin(i * 1.3) * 0.4 - 0.6).toFixed(2)}s` }} />
      ))}
    </div>
  );
}

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return h; }
