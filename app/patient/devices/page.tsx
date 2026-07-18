"use client";

import React, { useState } from "react";
import { Icon, P } from "@/lib/icons";
import { Sparkline } from "@/components/ui";
import { useStore } from "@/lib/store";

const ACCENT: Record<string, { c: string; bg: string; d: string }> = {
  teal: { c: "var(--teal)", bg: "var(--teal-100)", d: "var(--teal-d)" },
  amber: { c: "var(--amber)", bg: "var(--amber-100)", d: "var(--amber-d)" },
  green: { c: "var(--green)", bg: "var(--green-100)", d: "var(--green-d)" },
  orange: { c: "var(--orange)", bg: "var(--orange-100)", d: "var(--orange-d)" },
};

export default function DevicesPage() {
  const { getPatient, toggleDevice, activePatientId } = useStore();
  const sarah = getPatient(activePatientId) || getPatient("sarah")!;
  const [uploaded, setUploaded] = useState(false);
  const connectedCount = sarah.devices.filter((d) => d.connected).length;

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Connected data</h1>
      <p style={{ fontSize: 15, color: "var(--soft)", margin: "0 0 20px" }}>
        Link your devices and results so your check-ins carry real signals. {connectedCount} of {sarah.devices.length} connected — readings feed straight into your care team&rsquo;s view.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {sarah.devices.map((d) => {
          const a = ACCENT[d.accent];
          return (
            <div key={d.id} className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, opacity: d.connected ? 1 : 0.96 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: a.bg, color: a.d, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon d={d.icon} size={21} color={a.d} stroke={1.7} />
                </div>
                {d.connected ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "var(--green-d)", background: "var(--green-100)", padding: "4px 9px", borderRadius: 20 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} /> Connected
                  </span>
                ) : (
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--faint)", background: "var(--wash)", border: "1px solid var(--line)", padding: "4px 9px", borderRadius: 20 }}>Not linked</span>
                )}
              </div>
              <div>
                <div style={{ fontSize: 15.5, fontWeight: 600 }}>{d.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--soft)" }}>{d.kind}</div>
              </div>
              {d.connected ? (
                <>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 600 }}>{d.reading}</div>
                      <div style={{ fontSize: 12, color: "var(--faint)" }}>{d.sub}</div>
                    </div>
                    <Sparkline data={d.spark} color={a.c} />
                  </div>
                  <button onClick={() => toggleDevice(activePatientId, d.id)} className="btn-ghost press" style={{ padding: 9, fontSize: 13 }}>Disconnect</button>
                </>
              ) : (
                <button onClick={() => toggleDevice(activePatientId, d.id)} className="btn-teal press" style={{ padding: 11, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  <Icon d={P.plus} size={16} color="#fff" stroke={2} /> Connect
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* blood test upload */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--red-100)", color: "var(--red-d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={P.drop} size={21} color="var(--red-d)" stroke={1.7} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Blood-test results</div>
            <div style={{ fontSize: 12.5, color: "var(--soft)" }}>Upload a lab report — our AI extracts the values and flags anything out of range.</div>
          </div>
        </div>
        {!uploaded ? (
          <button onClick={() => setUploaded(true)} className="hover-lift" style={{ width: "100%", border: "2px dashed var(--line)", background: "var(--wash)", borderRadius: 14, padding: "22px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", color: "var(--soft)", fontWeight: 600, fontSize: 14 }}>
            <Icon d={P.upload} size={18} color="var(--soft)" stroke={1.7} /> Upload lab report (PDF or photo)
          </button>
        ) : (
          <div className="fade-up">
            <div className="wash" style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <Icon d={P.check} size={18} color="var(--green-d)" stroke={2} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>bloods_may.pdf</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--green-d)", fontWeight: 600 }}>Extracted</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { k: "eGFR", v: "68 mL/min", flag: "In range", fg: "var(--green-d)", bg: "var(--green-100)" },
                { k: "Potassium", v: "5.3 mmol/L", flag: "High-normal", fg: "var(--amber-d)", bg: "var(--amber-100)" },
                { k: "NT-proBNP", v: "410 pg/mL", flag: "Raised", fg: "var(--orange-d)", bg: "var(--orange-100)" },
              ].map((b) => (
                <div key={b.k} className="wash" style={{ borderRadius: 12, padding: 13 }}>
                  <div style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{b.k}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginTop: 3 }}>{b.v}</div>
                  <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, fontWeight: 700, color: b.fg, background: b.bg, padding: "2px 8px", borderRadius: 20 }}>{b.flag}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 9, background: "var(--teal-50)", border: "1px solid var(--teal-100)", borderRadius: 12, padding: "12px 14px", marginTop: 12 }}>
              <Icon d={P.sparkles} size={16} color="var(--teal)" stroke={1.7} style={{ flex: "none", marginTop: 1 }} />
              <span style={{ fontSize: 13, color: "var(--teal-d)", lineHeight: 1.5 }}>Raised NT-proBNP with a high-normal potassium was shared with your care team alongside today&rsquo;s check-in.</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center", marginTop: 20, color: "var(--soft)" }}>
        <Icon d={P.shield} size={15} color="var(--soft)" stroke={1.6} />
        <span style={{ fontSize: 13 }}>You control every connection and can unlink a device at any time.</span>
      </div>
    </div>
  );
}
