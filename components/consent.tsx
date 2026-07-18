"use client";

import React, { useState } from "react";
import { Icon, P } from "@/lib/icons";
import { Toggle } from "@/components/ui";
import { useStore } from "@/lib/store";

const ROWS = [
  { k: "transcript", title: "Save conversation transcript", sub: "Keep a written record of what you say during check-ins.", def: true },
  { k: "process", title: "Temporarily process voice & images", sub: "Turn your voice and photos into structured data during a check-in.", def: true },
  { k: "rawAudio", title: "Retain raw audio & video", sub: "Keep the original recording after the check-in. Off by default.", def: false },
  { k: "home", title: "Include connected device data", sub: "Use readings from your watch, cuff, glucose and scale.", def: true },
  { k: "share", title: "Share summaries with your care team", sub: "Send structured check-in summaries to your clinicians.", def: true },
];

export function ConsentScreen({ patient }: { patient: any }) {
  const { giveConsent } = useStore();
  const [vals, setVals] = useState<Record<string, boolean>>(() => Object.fromEntries(ROWS.map((r) => [r.k, r.def])));
  const first = patient.name.split(" ")[0];

  return (
    <div className="fade-in">
      <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--teal-100)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Icon d={P.shieldCheck} size={26} color="var(--teal)" stroke={1.6} />
      </div>
      <h1 style={{ fontSize: 28, lineHeight: 1.15, marginBottom: 10 }}>Welcome, {first}. Your check-ins, under your control.</h1>
      <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--soft)", margin: "0 0 20px" }}>
        Dr Patel has set up your monitoring plan. Choose what Ambient Intelligence uses — nothing is shared with your care team unless you allow it, and you can change these any time.
      </p>

      <div className="card" style={{ padding: "4px 18px" }}>
        {ROWS.map((r, i) => (
          <div key={r.k} style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px 0", borderTop: i ? "1px solid var(--line2)" : "none" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{r.title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.45, color: "var(--soft)" }}>{r.sub}</div>
            </div>
            <Toggle on={vals[r.k]} onChange={() => setVals((v) => ({ ...v, [r.k]: !v[r.k] }))} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--teal-50)", border: "1px solid var(--teal-100)", borderRadius: 12, padding: "13px 15px", margin: "18px 0" }}>
        <Icon d={P.info} size={18} color="var(--teal)" stroke={1.6} />
        <span style={{ fontSize: 13.5, color: "var(--teal-d)", fontWeight: 500 }}>You can change these settings at any time.</span>
      </div>

      <button onClick={() => giveConsent(patient.id)} className="btn-teal press" style={{ width: "100%", padding: 16, fontSize: 16 }}>
        Agree &amp; continue
      </button>
      <div style={{ textAlign: "center", marginTop: 14 }}>
        <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 14, fontWeight: 600, color: "var(--teal-d)" }}>Learn how your information is used</a>
      </div>
    </div>
  );
}
