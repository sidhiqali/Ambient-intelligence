"use client";

import React, { useState } from "react";
import { Icon, P } from "@/lib/icons";

export function EmergencyAlert({ onContinue, onHome }: { onContinue?: () => void; onHome?: () => void }) {
  const [navving, setNavving] = useState(false);
  const [calling, setCalling] = useState(false);

  return (
    <div className="fade-in" style={{ maxWidth: 460, margin: "0 auto" }}>
      <div className="card" style={{ overflow: "hidden", border: "2px solid var(--red)", boxShadow: "0 24px 50px -24px rgba(191,68,58,.5)" }}>
        <div style={{ padding: "18px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--red)", fontSize: 12.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>
            <Icon d={P.alertCircle} size={17} color="var(--red)" stroke={2.2} /> Emergency alert
          </div>
          <h1 style={{ fontSize: 25, marginBottom: 8 }}>We detected a concern.</h1>
          <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--soft)", margin: 0 }}>
            Your heart rate has remained above <b>120 BPM</b> for the last 15 minutes while at rest.
          </p>
        </div>

        {/* nearest facility */}
        <div style={{ padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>St. Mary&rsquo;s Hospital</div>
              <div style={{ fontSize: 13, color: "var(--green-d)", fontWeight: 600 }}>Emergency Department Open</div>
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--teal-d)", background: "var(--teal-100)", padding: "5px 11px", borderRadius: 20, whiteSpace: "nowrap" }}>8 min away</span>
          </div>
          <MapCard />
          <button onClick={() => setNavving(true)} className="press" style={{ width: "100%", background: navving ? "var(--green)" : "#2f6bd8", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
            <Icon d={navving ? P.check : P.arrowUp} size={18} color="#fff" stroke={2} /> {navving ? "Navigation started" : "Start Navigation"}
          </button>
        </div>

        {/* live vitals */}
        <div style={{ padding: "18px 20px 4px" }}>
          <VitalRow icon={P.heart} color="var(--red)" label="Heart Rate" value="124" unit="BPM" />
          <VitalRow icon={P.drop} color="#2f6bd8" label="SpO₂" value="94" unit="%" />
        </div>

        <div style={{ padding: "6px 20px 20px" }}>
          <button onClick={() => setCalling(true)} className="press" style={{ width: "100%", background: calling ? "var(--teal)" : "var(--wash)", color: calling ? "#fff" : "var(--teal-d)", border: `1px solid ${calling ? "var(--teal)" : "var(--line)"}`, borderRadius: 12, padding: 13, fontSize: 14.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon d={P.phone} size={17} color={calling ? "#fff" : "var(--teal-d)"} stroke={1.9} /> {calling ? "Connecting to your clinician…" : "Call Clinician"}
          </button>
          <p style={{ fontSize: 12, color: "var(--faint)", textAlign: "center", lineHeight: 1.5, margin: "12px 0 0" }}>
            Your medical record and live vitals will be shared automatically with the responders.
          </p>
        </div>
      </div>

      {(onContinue || onHome) && (
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {onContinue && <button onClick={onContinue} className="btn-ghost press" style={{ flex: 1, padding: 13, fontSize: 14 }}>I&rsquo;m safe — continue</button>}
          {onHome && <button onClick={onHome} className="btn-ghost press" style={{ flex: 1, padding: 13, fontSize: 14 }}>Back home</button>}
        </div>
      )}
    </div>
  );
}

function VitalRow({ icon, color, label, value, unit }: any) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderTop: "1px solid var(--line2)" }}>
      <Icon d={icon} size={19} color={color} stroke={1.8} />
      <span style={{ flex: 1, fontSize: 14.5, color: "var(--soft)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 700 }}>{value}</span>
      <span style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600 }}>{unit}</span>
    </div>
  );
}

// Offline stylized map (no external tiles) with a route to the hospital pin.
function MapCard() {
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)", height: 150, position: "relative", background: "#EAEEE9" }}>
      <svg viewBox="0 0 400 150" width="100%" height="150" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="150" fill="#EAF0EA" />
        <path d="M60 -10 L140 160" stroke="#DDE4DC" strokeWidth="14" />
        <path d="M-10 60 L410 40" stroke="#DDE4DC" strokeWidth="12" />
        <path d="M-10 110 L410 96" stroke="#DDE4DC" strokeWidth="10" />
        <path d="M250 -10 L300 160" stroke="#DDE4DC" strokeWidth="10" />
        <ellipse cx="120" cy="52" rx="46" ry="26" fill="#CDE3C8" />
        <ellipse cx="330" cy="118" rx="40" ry="22" fill="#CDE3C8" />
        <path d="M110 120 C 170 100, 210 70, 300 52" stroke="#2f6bd8" strokeWidth="4" fill="none" strokeDasharray="2 7" strokeLinecap="round" />
        {/* you */}
        <circle cx="110" cy="120" r="8" fill="#0F7C8A" stroke="#fff" strokeWidth="3" />
        {/* hospital */}
        <g transform="translate(300 52)">
          <path d="M0 -18 C 10 -18, 16 -10, 16 -2 C 16 8, 0 18, 0 18 C 0 18, -16 8, -16 -2 C -16 -10, -10 -18, 0 -18 Z" fill="#BF443A" stroke="#fff" strokeWidth="2" />
          <path d="M-2 -10 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 v-4 h4 z" fill="#fff" />
        </g>
        <text x="196" y="88" fontSize="13" fontWeight="700" fill="#7C8A82" fontFamily="var(--font-heading)">London</text>
      </svg>
    </div>
  );
}
