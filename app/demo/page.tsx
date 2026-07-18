"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon, P } from "@/lib/icons";
import { Logo } from "@/components/ui";
import { APP_NAME } from "@/lib/seed";

const STEPS = [
  "Clinician adds a new patient & plan (right)",
  "Patient appears live in the app (left)",
  "Patient does a check-in (left)",
  "Status updates live in the clinician queue (right)",
];

export default function DemoSplit() {
  const [nonce, setNonce] = useState(0);
  const reload = () => setNonce((n) => n + 1);

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 600px at 50% -10%, var(--teal-50), transparent), var(--bg)", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 24px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,.7)", backdropFilter: "blur(8px)" }}>
        <Link href="/" style={{ color: "inherit" }}><Logo name={APP_NAME} size={30} /></Link>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "var(--teal-d)", background: "var(--teal-100)", padding: "5px 12px", borderRadius: 20 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--teal)", animation: "pulse 1.8s infinite" }} /> Live · both sides share one dataset
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button onClick={reload} className="btn-ghost press" style={{ padding: "8px 14px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Icon d={P.refresh} size={15} color="var(--teal-d)" stroke={1.7} /> Reset views
          </button>
          <Link href="/" className="btn-ghost" style={{ padding: "8px 14px", fontSize: 13 }}>Exit demo</Link>
        </div>
      </header>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", padding: "12px 20px 0" }}>
        {STEPS.map((s, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--soft)", background: "var(--card)", border: "1px solid var(--line)", padding: "6px 12px", borderRadius: 20 }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--teal-100)", color: "var(--teal-d)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
            {s}
          </span>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", gap: 28, alignItems: "flex-start", justifyContent: "center", padding: "24px 24px 40px", flexWrap: "wrap" }}>
        {/* PATIENT PHONE */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--soft)", textTransform: "uppercase", letterSpacing: ".08em", display: "flex", alignItems: "center", gap: 7 }}>
            <Icon d={P.user} size={15} color="var(--teal)" stroke={1.7} /> Patient · mobile
          </div>
          <div style={{ width: 428, height: 858, background: "#0e1417", borderRadius: 48, padding: 12, boxShadow: "0 40px 80px -30px rgba(20,35,45,.5), 0 0 0 1px rgba(0,0,0,.06)", flex: "none" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 38, overflow: "hidden", background: "var(--bg)", position: "relative" }}>
              <iframe key={"p" + nonce} src="/patient" title="Patient app" style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
            </div>
          </div>
        </div>

        {/* CLINICIAN DESKTOP */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 720px", minWidth: 620, maxWidth: 1000 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--soft)", textTransform: "uppercase", letterSpacing: ".08em", display: "flex", alignItems: "center", gap: 7 }}>
            <Icon d={P.chart} size={15} color="var(--teal)" stroke={1.7} /> Clinician · desktop
          </div>
          <div style={{ height: 858, borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)", boxShadow: "0 40px 80px -30px rgba(20,35,45,.4)", background: "var(--card)", display: "flex", flexDirection: "column" }}>
            <div style={{ height: 38, flex: "none", background: "var(--wash)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}>
              <span style={{ display: "flex", gap: 6 }}>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#f0685f" }} />
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#f6c250" }} />
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#62c464" }} />
              </span>
              <div style={{ marginLeft: 8, flex: 1, maxWidth: 320, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 7, padding: "4px 12px", fontSize: 12, color: "var(--faint)" }}>ambient-intelligence.health / clinician</div>
            </div>
            <iframe key={"c" + nonce} src="/clinician" title="Clinician portal" style={{ flex: 1, border: "none", width: "100%", display: "block" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
