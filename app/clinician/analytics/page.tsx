"use client";

import React, { useState } from "react";
import { Icon, P } from "@/lib/icons";
import { DemoBadge } from "@/components/ui";

const TABS = [
  { id: "engagement", label: "Engagement" },
  { id: "clinical", label: "Clinical changes" },
  { id: "review", label: "Review activity" },
  { id: "performance", label: "Monitoring performance" },
];

const DATA: any = {
  engagement: { stats: [["Check-in completion", "86%", "+4%", "var(--green-d)"], ["Avg check-in duration", "41s", "−6s", "var(--green-d)"], ["Missed check-ins", "4", "−2", "var(--green-d)"], ["Increasing frequency", "7", "+3", "var(--amber-d)"]], title: "Check-in completion rate", data: [78, 81, 84, 86], fmt: (v: number) => v + "%" },
  clinical: { stats: [["Meaningful changes surfaced", "9", "+2", "var(--amber-d)"], ["Functional changes", "6", "+1", "var(--amber-d)"], ["Medication concerns", "3", "+1", "var(--amber-d)"], ["Measurements requested", "11", "+4", "var(--teal-d)"]], title: "Meaningful changes surfaced", data: [4, 6, 7, 9], fmt: (v: number) => v },
  review: { stats: [["Cases reviewed", "8", "+3", "var(--green-d)"], ["Reviews initiated", "8", "+3", "var(--green-d)"], ["Priority increased", "2", "+1", "var(--amber-d)"], ["Priority reduced", "3", "+2", "var(--green-d)"]], title: "Cases reviewed by clinicians", data: [3, 5, 6, 8], fmt: (v: number) => v },
  performance: { stats: [["Median change→review", "5.2h", "−1.8h", "var(--green-d)"], ["Same-day reviews", "74%", "+9%", "var(--green-d)"], ["Additional measurements", "11", "+4", "var(--teal-d)"], ["Plans stepped up", "7", "+3", "var(--amber-d)"]], title: "Median hours from change to review", data: [9.1, 7.4, 6.3, 5.2], fmt: (v: number) => v + "h" },
};

const CAPTURED = [
  { label: "Functional changes", value: "6", bg: "var(--orange-100)", fg: "var(--orange-d)", icon: P.trendUp },
  { label: "Medication concerns", value: "3", bg: "var(--amber-100)", fg: "var(--amber-d)", icon: P.pill },
  { label: "Symptom changes", value: "8", bg: "var(--amber-100)", fg: "var(--amber-d)", icon: P.alertCircle },
  { label: "Missed commitments", value: "4", bg: "var(--red-100)", fg: "var(--red-d)", icon: P.x },
  { label: "Unresolved questions", value: "5", bg: "var(--teal-100)", fg: "var(--teal-d)", icon: P.info },
  { label: "Home measurements", value: "11", bg: "var(--green-100)", fg: "var(--green-d)", icon: P.gauge },
];

export default function Analytics() {
  const [tab, setTab] = useState("engagement");
  const t = DATA[tab];

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }} className="fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontSize: 28 }}>Between-appointment analytics</h1>
        <DemoBadge />
      </div>
      <p style={{ fontSize: 14.5, color: "var(--soft)", margin: "0 0 20px" }}>Care-organisation view · previous four weeks. Operational metrics only — no claims of clinical outcomes.</p>

      <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--line)", marginBottom: 22 }}>
        {TABS.map((x) => {
          const on = tab === x.id;
          return (
            <button key={x.id} onClick={() => setTab(x.id)} style={{ background: "none", border: "none", borderBottom: `2px solid ${on ? "var(--teal)" : "transparent"}`, color: on ? "var(--teal-d)" : "var(--soft)", padding: "11px 15px", fontSize: 14, fontWeight: 600, marginBottom: -1, cursor: "pointer" }}>{x.label}</button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        {t.stats.map(([label, value, trend, fg]: any, i: number) => (
          <div key={i} className="card" style={{ padding: 17 }}>
            <div style={{ fontSize: 12.5, color: "var(--soft)", marginBottom: 8 }}>{label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 600 }}>{value}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: fg }}>{trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        <div className="card" style={{ padding: 22 }}>
          <h2 style={{ fontSize: 18, marginBottom: 3 }}>{t.title}</h2>
          <p style={{ fontSize: 12.5, color: "var(--faint)", margin: "0 0 18px" }}>Trend over the previous four weeks</p>
          <LineChart data={t.data} fmt={t.fmt} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: "var(--faint)", fontWeight: 600 }}>
            <span>Wk 1</span><span>Wk 2</span><span>Wk 3</span><span>Wk 4</span>
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <h2 style={{ fontSize: 18, marginBottom: 3 }}>What the platform captured</h2>
          <p style={{ fontSize: 12.5, color: "var(--faint)", margin: "0 0 14px" }}>Between appointments · this period</p>
          {CAPTURED.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: i ? "1px solid var(--line2)" : "none" }}>
              <span style={{ width: 30, height: 30, flex: "none", borderRadius: 8, background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={c.icon} size={16} color={c.fg} stroke={1.7} />
              </span>
              <span style={{ flex: 1, fontSize: 13.5, color: "var(--soft)" }}>{c.label}</span>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 600 }}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LineChart({ data, fmt }: { data: number[]; fmt: (v: number) => any }) {
  const cw = 440, ch = 180, pad = 14;
  const maxV = Math.max(...data) * 1.15;
  const pts = data.map((v, i) => [pad + i * ((cw - 2 * pad) / (data.length - 1)), ch - pad - (v / maxV) * (ch - 2 * pad)]);
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = path + ` L${pts[pts.length - 1][0].toFixed(1)} ${ch - pad} L${pts[0][0].toFixed(1)} ${ch - pad} Z`;
  return (
    <svg viewBox={`0 0 ${cw} ${ch}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
      {[1, 2, 3].map((g) => <line key={g} x1={pad} x2={cw - pad} y1={pad + g * ((ch - 2 * pad) / 4)} y2={pad + g * ((ch - 2 * pad) / 4)} stroke="var(--line2)" strokeWidth={1} />)}
      <path d={area} fill="var(--teal-100)" opacity={0.55} />
      <path d={path} fill="none" stroke="var(--teal)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r={5} fill="var(--card)" stroke="var(--teal)" strokeWidth={2.5} />
          <text x={p[0]} y={p[1] - 13} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--teal-d)" fontFamily="var(--font-heading)">{fmt(data[i])}</text>
        </g>
      ))}
    </svg>
  );
}
