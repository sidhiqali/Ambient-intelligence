"use client";

import React, { useEffect, useRef, useState } from "react";
import { Icon, P } from "@/lib/icons";

type Status = "connecting" | "ready" | "listening" | "speaking" | "ended" | "error";
interface Msg { who: "user" | "agent"; text: string }

const SYSTEM_PROMPT =
  "You are the voice of Ambient Intelligence, a warm chronic-care check-in assistant. Ask the patient how they've been since the last check-in — energy, breathing, sleep, any new symptoms. Ask at most ONE focused follow-up. Then give a brief spoken assessment of how serious it sounds (say clearly whether it seems low, medium or high concern) and a reassuring next step. Never diagnose or change medication. Keep replies short and kind.";

export function LiveVoiceAgent({ firstName, onComplete, onBack }: { firstName: string; onComplete: (transcript: string) => void; onBack: () => void }) {
  const [status, setStatus] = useState<Status>("connecting");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [err, setErr] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const micCtx = useRef<AudioContext | null>(null);
  const playCtx = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const nextTime = useRef(0);
  const sources = useRef<AudioBufferSourceNode[]>([]);
  const userText = useRef<string[]>([]);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    connect();
    return () => teardown();
    // eslint-disable-next-line
  }, []);

  const teardown = () => {
    try { nodeRef.current?.disconnect(); } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try { micCtx.current?.close(); } catch {}
    try { playCtx.current?.close(); } catch {}
    try { wsRef.current?.close(); } catch {}
    sources.current.forEach((s) => { try { s.stop(); } catch {} });
  };

  const playPCM = (b64: string) => {
    try {
      const ctx = playCtx.current!;
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const i16 = new Int16Array(bytes.buffer);
      const f32 = new Float32Array(i16.length);
      for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;
      const buf = ctx.createBuffer(1, f32.length, 24000);
      buf.getChannelData(0).set(f32);
      const src = ctx.createBufferSource();
      src.buffer = buf; src.connect(ctx.destination);
      const t = Math.max(nextTime.current, ctx.currentTime);
      src.start(t); nextTime.current = t + buf.duration;
      sources.current.push(src);
      setStatus("speaking");
      src.onended = () => { if (nextTime.current <= ctx.currentTime + 0.05) setStatus("listening"); };
    } catch {}
  };

  const bargeIn = () => {
    sources.current.forEach((s) => { try { s.stop(); } catch {} });
    sources.current = [];
    nextTime.current = 0;
    setStatus("listening");
  };

  const connect = async () => {
    let token = "";
    try {
      const r = await fetch("/api/voice-token");
      const d = await r.json();
      token = d.token;
      if (!token) throw new Error("no token");
    } catch {
      setErr("Couldn't get a voice token. Check your AssemblyAI key.");
      setStatus("error");
      return;
    }

    let ws: WebSocket;
    try {
      ws = new WebSocket(`wss://agents.assemblyai.com/v1/ws?token=${encodeURIComponent(token)}`);
    } catch {
      setErr("Couldn't open the voice connection.");
      setStatus("error");
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "session.update",
        session: {
          system_prompt: SYSTEM_PROMPT,
          greeting: `Hi ${firstName}, it's your daily check-in from Ambient Intelligence. How have you been feeling since we last spoke?`,
          output: { voice: "ivy" },
        },
      }));
      startMic().catch(() => { setErr("Microphone access is needed for the voice agent."); setStatus("error"); });
    };

    ws.onmessage = (e) => {
      let ev: any;
      try { ev = JSON.parse(e.data); } catch { return; }
      switch (ev.type) {
        case "session.ready": setStatus("listening"); break;
        case "input.speech.started": bargeIn(); break;
        case "transcript.user":
          if (ev.text) { userText.current.push(ev.text); setMsgs((m) => [...m, { who: "user", text: ev.text }]); }
          break;
        case "transcript.agent":
          if (ev.text) setMsgs((m) => [...m, { who: "agent", text: ev.text }]);
          break;
        case "reply.audio":
          if (ev.audio) playPCM(ev.audio);
          break;
        case "error":
        case "session.error":
          setErr(ev.error || ev.message || "Voice agent error."); setStatus("error"); break;
      }
    };

    ws.onerror = () => { if (status !== "ended") { setErr("Voice connection error."); setStatus("error"); } };
    ws.onclose = () => { if (status !== "ended" && status !== "error") setStatus("ended"); };
  };

  const startMic = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    streamRef.current = stream;
    const ctx = new AudioContext({ sampleRate: 24000 });
    micCtx.current = ctx;
    playCtx.current = new AudioContext({ sampleRate: 24000 });
    await ctx.audioWorklet.addModule("/agent-worklet.js");
    const src = ctx.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(ctx, "pcm-worklet");
    nodeRef.current = node;
    node.port.onmessage = (e) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const bytes = new Uint8Array(e.data as ArrayBuffer);
      let bin = "";
      const CH = 0x8000;
      for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CH)) as any);
      ws.send(JSON.stringify({ type: "input.audio", audio: btoa(bin) }));
    };
    src.connect(node);
    // node needs a destination to pull audio in some browsers
    node.connect(ctx.destination);
  };

  const end = () => {
    setStatus("ended");
    teardown();
    onComplete(userText.current.join(" ").trim());
  };

  const statusLabel =
    status === "connecting" ? "Connecting…" :
    status === "speaking" ? "Ambient Intelligence is speaking…" :
    status === "listening" || status === "ready" ? "Listening — speak naturally" :
    status === "error" ? "Connection problem" : "Call ended";

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={() => { teardown(); onBack(); }} className="hover-teal" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 20, padding: "8px 13px", fontSize: 13, fontWeight: 600, color: "var(--soft)" }}>
          <Icon d={P.chevronLeft} size={15} color="currentColor" stroke={1.7} /> Back
        </button>
        <h1 style={{ fontSize: 22 }}>Live voice agent</h1>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "var(--teal-d)", background: "var(--teal-100)", padding: "4px 10px", borderRadius: 20 }}>AssemblyAI</span>
      </div>

      <div style={{ background: "linear-gradient(180deg,#0d5560,#0a4550)", borderRadius: 22, padding: "24px 22px", minHeight: 440, display: "flex", flexDirection: "column", boxShadow: "0 24px 50px -24px rgba(10,69,80,.7)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, alignSelf: "center", color: "#fff", fontSize: 13, fontWeight: 600 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: status === "error" ? "#ff6b5e" : "#7fe0c8", animation: status === "listening" || status === "speaking" ? "pulse 1.4s infinite" : "none" }} />
          {statusLabel}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginTop: 20, overflowY: "auto", maxHeight: 320 }}>
          {msgs.length === 0 && status !== "error" && (
            <div style={{ margin: "auto", textAlign: "center", color: "rgba(255,255,255,.75)", fontSize: 15, maxWidth: 300 }}>
              The agent will greet you and listen. Just talk — it hears you in real time and replies out loud.
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.who === "user" ? "flex-end" : "flex-start", maxWidth: "82%" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", marginBottom: 3, textAlign: m.who === "user" ? "right" : "left" }}>{m.who === "user" ? "You" : "Agent"}</div>
              <div style={{ background: m.who === "user" ? "#fff" : "rgba(255,255,255,.12)", color: m.who === "user" ? "var(--teal-d)" : "#fff", borderRadius: m.who === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "11px 14px", fontSize: 15.5, lineHeight: 1.45 }}>{m.text}</div>
            </div>
          ))}
          {status === "error" && (
            <div style={{ margin: "auto", textAlign: "center", color: "#fff", background: "rgba(255,107,94,.2)", borderRadius: 12, padding: "14px 16px", fontSize: 14, maxWidth: 320 }}>{err}</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
          {status !== "error" ? (
            <button onClick={end} className="press" style={{ flex: 1, background: "#fff", color: "var(--teal-d)", border: "none", borderRadius: 13, padding: 15, fontSize: 15.5, fontWeight: 700 }}>
              End &amp; save check-in
            </button>
          ) : (
            <button onClick={() => { teardown(); onBack(); }} className="press" style={{ flex: 1, background: "#fff", color: "var(--teal-d)", border: "none", borderRadius: 13, padding: 15, fontSize: 15.5, fontWeight: 700 }}>
              Try another way
            </button>
          )}
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--soft)", textAlign: "center", marginTop: 12 }}>Real-time speech recognition &amp; a spoken AI agent, via AssemblyAI. The agent flags how serious it sounds; your care team decides.</p>
    </div>
  );
}
