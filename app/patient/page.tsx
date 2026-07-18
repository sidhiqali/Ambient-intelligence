"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon, P } from "@/lib/icons";
import { Avatar, SafetyNote, PriorityPill, Sparkline } from "@/components/ui";
import { useStore } from "@/lib/store";
import { ConsentScreen } from "@/components/consent";
import { PRIORITY_META } from "@/lib/priority";

export default function PatientHome() {
  const { getPatient, activePatientId } = useStore();
  const sarah = getPatient(activePatientId) || getPatient("sarah")!;
  const meta = PRIORITY_META[sarah.priority];
  const [bgDismissed, setBgDismissed] = useState(false);

  if (!sarah.consented) return <ConsentScreen patient={sarah} />;
  const lastCheckin = sarah.checkins.find((c) => !c.seeded);
  const streak = sarah.streak || 0;

  const CHIP: Record<string, { bg: string; fg: string }> = {
    green: { bg: "var(--green-100)", fg: "var(--green-d)" },
    amber: { bg: "var(--amber-100)", fg: "var(--amber-d)" },
    orange: { bg: "var(--orange-100)", fg: "var(--orange-d)" },
    teal: { bg: "var(--teal-100)", fg: "var(--teal-d)" },
  };
  const signals = [
    { label: "Resting HR", value: "68", unit: "bpm", spark: [70, 69, 71, 68, 67, 72, 68], color: "var(--teal)", chip: "92 overnight", tone: "amber" },
    { label: "Blood pressure", value: "138/84", unit: "mmHg", spark: [128, 130, 132, 134, 136, 137, 138], color: "var(--amber)", chip: "Slightly high", tone: "amber" },
    { label: "SpO₂", value: "97", unit: "%", spark: [98, 97, 97, 96, 97, 97, 97], color: "var(--green)", chip: "Normal", tone: "green" },
    { label: "HRV", value: "42", unit: "ms", spark: [46, 45, 44, 43, 41, 42, 42], color: "var(--teal)", chip: "Normal", tone: "green" },
    { label: "Steps", value: "3,240", unit: "today", spark: [5, 4.2, 3.8, 3.5, 3.2, 3.1, 3.24], color: "var(--teal)", chip: "Below goal", tone: "amber" },
    { label: "Sleep", value: "6h 12m", unit: "last night", spark: [7.1, 6.8, 6.5, 6.2, 6.4, 6.1, 6.2], color: "var(--amber)", chip: "Short", tone: "amber" },
    { label: "Weight", value: "78.4", unit: "kg", spark: [77.5, 77.7, 77.9, 78, 78.2, 78.3, 78.4], color: "var(--orange)", chip: "+0.6 kg", tone: "orange" },
    { label: "Glucose", value: "6.4", unit: "mmol/L", spark: [6.1, 6.3, 6, 6.5, 6.4, 6.2, 6.4], color: "var(--teal)", chip: "In range", tone: "green" },
  ];

  const cards = [
    { label: "Next medication reminder", value: `${sarah.medication} · 8:00 pm`, meta: "Today", icon: P.pill, bg: "var(--teal-100)", fg: "var(--teal-d)" },
    { label: "Latest blood-pressure reading", value: "138 / 84 mmHg", meta: "2 days ago", icon: P.gauge, bg: "var(--amber-100)", fg: "var(--amber-d)" },
    { label: "Next planned care-team review", value: "Fri 15 May", meta: "In 3 days", icon: P.calendar, bg: "var(--green-100)", fg: "var(--green-d)" },
  ];

  return (
    <div className="fade-in">
      {sarah.priority === "High" && (
        <Link href="/patient/emergency" style={{ display: "flex", alignItems: "center", gap: 11, background: "var(--red-100)", border: "1px solid var(--red)", borderRadius: 14, padding: "13px 15px", marginBottom: 14, color: "var(--red-d)" }}>
          <Icon d={P.alertCircle} size={20} color="var(--red-d)" stroke={2} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>We detected a concern</div>
            <div style={{ fontSize: 12.5, color: "var(--red-d)", opacity: .85 }}>Tap for emergency guidance and your nearest open department.</div>
          </div>
          <Icon d={P.chevronRight} size={18} color="var(--red-d)" stroke={2} />
        </Link>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--soft)", fontWeight: 500 }}>Tuesday, 12 May</div>
          <h1 style={{ fontSize: 30, marginTop: 2 }}>Good morning, {sarah.name.split(" ")[0]}</h1>
        </div>
        <Avatar initials={sarah.initials} soft size={48} />
      </div>

      {/* streak */}
      <div style={{ marginTop: 12, borderRadius: 18, overflow: "hidden", border: "1px solid #F0DEBE", background: "linear-gradient(135deg,#FFF7EC,var(--card) 60%)", boxShadow: "0 10px 26px -18px rgba(232,121,31,.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 16px 12px" }}>
          <div style={{ position: "relative", width: 52, height: 52, flex: "none", borderRadius: 16, background: "linear-gradient(135deg,#F8B84E,#E8791F)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 27, boxShadow: "0 10px 20px -8px rgba(232,121,31,.65)" }}>
            🔥
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 30, fontWeight: 700, lineHeight: 1, color: "var(--ink)" }}>{streak}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--orange-d)" }}>day streak</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--soft)", marginTop: 4, lineHeight: 1.4 }}>
              {streak > 0 ? "Checking in keeps your care team ahead of changes." : "Do your first check-in to light the flame."}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, padding: "0 14px 14px" }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
            const todayIdx = 3; // demo "today" = Thursday, so a streak fills Mon→today
            const done = i <= todayIdx && todayIdx - i < streak;
            const today = i === todayIdx;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{ width: "100%", height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: done ? "linear-gradient(135deg,#F8B84E,#E8791F)" : "rgba(255,255,255,.6)", border: today && !done ? "2px dashed var(--orange)" : done ? "none" : "1px solid #F0DEBE", color: "#fff", boxShadow: done ? "0 4px 10px -5px rgba(232,121,31,.6)" : "none" }}>
                  {done ? <Icon d={P.check} size={15} color="#fff" stroke={2.6} /> : today ? <span style={{ fontSize: 14 }}>🔥</span> : ""}
                </div>
                <span style={{ fontSize: 10.5, color: today ? "var(--orange-d)" : "var(--faint)", fontWeight: 700 }}>{d}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero check-in card */}
      <div style={{ background: "linear-gradient(135deg,var(--teal),var(--teal-d))", borderRadius: 20, padding: "26px 26px", marginTop: 18, position: "relative", overflow: "hidden", boxShadow: "0 24px 50px -24px rgba(15,124,138,.6)" }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 190, height: 190, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
        <div style={{ position: "absolute", right: 60, bottom: -60, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.16)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 20, marginBottom: 14 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", animation: "pulse 1.8s infinite" }} />
          Ready now
        </div>
        <h2 style={{ color: "#fff", fontSize: 26, marginBottom: 8 }}>Your check-in is ready</h2>
        <p style={{ color: "rgba(255,255,255,.9)", fontSize: 15, lineHeight: 1.5, margin: "0 0 20px", maxWidth: 440 }}>
          Tell us how you've felt since your last check-in — by voice, video, a photo, or text. It normally takes less than a minute.
        </p>
        <Link href="/patient/checkin" className="press" style={{ display: "inline-flex", background: "#fff", color: "var(--teal-d)", borderRadius: 13, padding: "15px 22px", fontSize: 16, fontWeight: 700, alignItems: "center", gap: 9 }}>
          <Icon d={P.mic} size={20} color="var(--teal-d)" stroke={1.8} />
          Start check-in
        </Link>
      </div>

      {/* status */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: meta.bg, borderRadius: 12, padding: "12px 15px", marginTop: 14 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: meta.accent }} />
        <span style={{ fontSize: 13.5, color: meta.fg, fontWeight: 600, flex: 1 }}>
          Current status: {sarah.priority === "Low" ? "Stable monitoring" : sarah.priority === "Medium" ? "Follow-up requested" : "Closer monitoring — care team notified"}
        </span>
        <PriorityPill priority={sarah.priority} />
      </div>

      {/* background detection (watch-triggered check-in) */}
      {!bgDismissed && (
        <div className="card fade-up" style={{ padding: 16, marginTop: 14, borderColor: "var(--teal-100)", background: "linear-gradient(180deg,var(--teal-50),var(--card))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--teal-100)", color: "var(--teal-d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon d={P.watch} size={18} color="var(--teal-d)" stroke={1.7} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--teal)" }}>Background detection · Apple Watch</div>
            <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "var(--teal)", animation: "pulse 1.8s infinite" }} />
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--ink)", margin: 0 }}>
            Your resting heart rate ran high overnight — <b>92 bpm</b> vs your usual ~68. Everything okay? A 20-second check-in helps your team be sure.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 13 }}>
            <Link href="/patient/checkin" className="btn-teal press" style={{ flex: 1, padding: 12, fontSize: 14.5, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <Icon d={P.mic} size={16} color="#fff" stroke={1.8} /> Yes, quick check-in
            </Link>
            <button onClick={() => setBgDismissed(true)} className="btn-ghost press" style={{ flex: "none", padding: "12px 16px", fontSize: 14 }}>I&rsquo;m fine</button>
          </div>
        </div>
      )}

      {/* AI-read health signals */}
      <div className="card" style={{ padding: 18, marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <Icon d={P.sparkles} size={16} color="var(--teal)" stroke={1.7} />
          <h2 style={{ fontSize: 16 }}>Your health signals</h2>
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "var(--teal-d)", background: "var(--teal-100)", padding: "3px 9px", borderRadius: 20 }}>AI-read</span>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--soft)", margin: "0 0 14px" }}>Read from your connected devices and reviewed by your care team.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
          {signals.map((s) => (
            <div key={s.label} className="wash" style={{ borderRadius: 12, padding: 12, minWidth: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--soft)", fontWeight: 600, lineHeight: 1.3 }}>{s.label}</div>
                <Sparkline data={s.spark} color={s.color} w={40} h={18} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{s.value} <span style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 500 }}>{s.unit}</span></div>
              <span style={{ display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 700, color: CHIP[s.tone].fg, background: CHIP[s.tone].bg, padding: "2px 8px", borderRadius: 20 }}>{s.chip}</span>
            </div>
          ))}
        </div>
      </div>

      {lastCheckin?.analysis?.patientMessage && (
        <div className="card fade-up" style={{ padding: 18, marginTop: 14, background: "linear-gradient(180deg,var(--teal-50),var(--card))", borderColor: "var(--teal-100)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--teal)", marginBottom: 8 }}>
            <Icon d={P.sparkles} size={14} color="var(--teal)" stroke={1.7} /> Today's focus
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink)", margin: 0 }}>{lastCheckin.analysis.patientMessage}</p>
        </div>
      )}

      {/* info cards */}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {cards.map((c, i) => (
          <div key={i} className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: 15 }}>
            <div style={{ width: 42, height: 42, flex: "none", borderRadius: 11, background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon d={c.icon} size={19} color={c.fg} stroke={1.7} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, color: "var(--soft)", fontWeight: 600 }}>{c.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 1 }}>{c.value}</div>
            </div>
            <div style={{ fontSize: 13, color: "var(--faint)", fontWeight: 500 }}>{c.meta}</div>
          </div>
        ))}
      </div>

      <SafetyNote />
    </div>
  );
}
