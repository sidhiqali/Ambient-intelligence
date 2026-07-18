"use client";

import React from "react";
import Link from "next/link";
import { Icon, P } from "@/lib/icons";
import { PRIORITY_META } from "@/lib/priority";
import { useStore } from "@/lib/store";

const BASE = [
  { when: "Week 1", title: "Stable", status: "Stable", dot: "var(--green)", chipBg: "var(--green-100)", chipFg: "var(--green-d)" },
  { when: "Week 2", title: "Stable", status: "Stable", dot: "var(--green)", chipBg: "var(--green-100)", chipFg: "var(--green-d)" },
  { when: "Week 3", title: "More tired than usual", status: "Noted", dot: "var(--amber)", chipBg: "var(--amber-100)", chipFg: "var(--amber-d)" },
];

export default function HistoryPage() {
  const { getPatient, activePatientId } = useStore();
  const sarah = getPatient(activePatientId) || getPatient("sarah")!;

  const live = sarah.checkins.map((c) => {
    if (c.analysis.unclear) {
      return { when: c.when, title: "Check-in incomplete — we couldn't capture clear information", status: "Needs retry", dot: "var(--amber)", chipBg: "var(--amber-100)", chipFg: "var(--amber-d)", mode: c.mode, retry: true };
    }
    const m = PRIORITY_META[c.priority];
    return { when: c.when, title: c.analysis.changes[0] || "Check-in shared", status: c.priority === "High" ? "Shared" : c.priority === "Medium" ? "Noted" : "Stable", dot: m.accent, chipBg: m.bg, chipFg: m.fg, mode: c.mode, retry: false };
  });

  const items = [...live, ...[...BASE].reverse()];

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: 28, margin: "0 0 4px" }}>Your timeline</h1>
      <p style={{ fontSize: 15, color: "var(--soft)", margin: "0 0 24px" }}>A simple record of how you&rsquo;ve been. Your care team sees the clinical detail.</p>

      <div style={{ position: "relative", paddingLeft: 4 }}>
        {items.map((h, i) => (
          <div key={i} style={{ display: "flex", gap: 16, paddingBottom: 6 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: h.dot, border: "3px solid var(--bg)", boxShadow: `0 0 0 1px ${h.dot}` }} />
              {i < items.length - 1 && <span style={{ width: 2, flex: 1, background: "var(--line)", margin: "2px 0" }} />}
            </div>
            <div className="card" style={{ flex: 1, padding: 15, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: "var(--faint)", fontWeight: 600 }}>{h.when}{(h as any).mode ? ` · ${(h as any).mode} check-in` : ""}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: h.chipFg, background: h.chipBg, padding: "3px 10px", borderRadius: 20 }}>{h.status}</span>
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 600 }}>{h.title}</div>
              {(h as any).retry && (
                <Link href="/patient/checkin" className="btn-teal press" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 11, padding: "9px 14px", fontSize: 13.5 }}>
                  <Icon d={P.refresh} size={15} color="#fff" stroke={1.8} /> Try the check-in again
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center", marginTop: 8, color: "var(--soft)" }}>
        <Icon d={P.shield} size={15} color="var(--soft)" stroke={1.6} />
        <span style={{ fontSize: 13 }}>Your care team makes all clinical decisions.</span>
      </div>
    </div>
  );
}
