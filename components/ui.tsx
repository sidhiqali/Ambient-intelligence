"use client";

import React from "react";
import { Icon, P } from "@/lib/icons";
import { Priority } from "@/lib/types";
import { PRIORITY_META } from "@/lib/priority";

export function Logo({ size = 30, showName = true, name = "Ambient Intelligence" }: { size?: number; showName?: boolean; name?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px -6px rgba(15,124,138,.6)" }}>
        <Icon d={P.logo} size={size * 0.6} color="#fff" stroke={1.9} />
      </div>
      {showName && <span style={{ fontFamily: "var(--font-heading)", fontSize: size * 0.57, fontWeight: 600, letterSpacing: ".01em" }}>{name}</span>}
    </div>
  );
}

export function Avatar({ initials, color = "var(--teal)", fg = "#fff", size = 42, soft = false }: { initials: string; color?: string; fg?: string; size?: number; soft?: boolean }) {
  return (
    <div style={{ width: size, height: size, flex: "none", borderRadius: "50%", background: soft ? "var(--teal-100)" : color, color: soft ? "var(--teal-d)" : fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

export function PriorityPill({ priority, full = false }: { priority: Priority; full?: boolean }) {
  const m = PRIORITY_META[priority];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, color: m.fg, background: m.bg, padding: "5px 12px", borderRadius: 20, whiteSpace: "nowrap" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.accent }} />
      {full ? m.label : priority}
    </span>
  );
}

export function AiBadge({ label = "AI-assisted" }: { label?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--teal-d)", background: "var(--teal-100)", padding: "4px 11px", borderRadius: 20 }}>
      <Icon d={P.ai} size={13} color="var(--teal-d)" stroke={1.8} />
      {label}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "var(--soft)", background: "var(--card)", border: "1px solid var(--line)", padding: "7px 12px", borderRadius: 20 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--amber)" }} />
      Demo data
    </span>
  );
}

export function Sparkline({ data, color = "var(--teal)", w = 96, h = 30 }: { data: number[]; color?: string; w?: number; h?: number }) {
  if (!data?.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / rng) * (h - 6)]);
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = path + ` L${w} ${h} L0 ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <path d={area} fill={color} opacity={0.12} />
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.8} fill={color} />
    </svg>
  );
}

export function Toggle({ on, onChange, size = 28 }: { on: boolean; onChange: () => void; size?: number }) {
  const w = size * 1.72;
  return (
    <button onClick={onChange} aria-pressed={on} style={{ flex: "none", width: w, height: size, borderRadius: size, border: "none", padding: 3, position: "relative", transition: "background .18s", background: on ? "var(--teal)" : "var(--line)", cursor: "pointer" }}>
      <span style={{ display: "block", width: size - 6, height: size - 6, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.25)", transition: "transform .18s", transform: `translateX(${on ? w - size : 0}px)` }} />
    </button>
  );
}

export function SafetyNote({ text = "Your care team makes all clinical decisions.", center = true }: { text?: string; center?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: center ? "center" : "flex-start", color: "var(--soft)", marginTop: 18 }}>
      <Icon d={P.shield} size={15} color="var(--soft)" stroke={1.6} />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{text}</span>
    </div>
  );
}
