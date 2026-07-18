"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon, P } from "@/lib/icons";
import { AiBadge, Avatar } from "@/components/ui";
import { useStore } from "@/lib/store";

const OPTIONS = [
  { id: "weekly", label: "Continue weekly", sub: "No change to current cadence", rec: false },
  { id: "tomorrow", label: "Check again tomorrow", sub: "A single earlier check-in", rec: false },
  { id: "daily3", label: "Daily for three days", sub: "Confirm whether the change is persistent", rec: true },
  { id: "appt", label: "Request clinician appointment", sub: "Bring the review forward to a visit", rec: false },
  { id: "return", label: "Return to weekly after stability", sub: "Step down once the change resolves", rec: false },
];

export default function Monitoring() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getPatient, setMonitoringPlan } = useStore();
  const patient = getPatient(id) || getPatient("sarah")!;
  const [choice, setChoice] = useState("daily3");
  const [approved, setApproved] = useState(false);

  const approve = () => {
    const label = OPTIONS.find((o) => o.id === choice)?.label || "Weekly";
    setMonitoringPlan(patient.id, label);
    setApproved(true);
  };

  return (
    <div style={{ maxWidth: 840, margin: "0 auto" }} className="fade-in">
      <button onClick={() => router.push(`/clinician/patient/${patient.id}`)} className="hover-teal" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--soft)", fontSize: 13, fontWeight: 600, padding: "0 0 14px" }}>
        <Icon d={P.chevronLeft} size={15} color="currentColor" stroke={1.7} /> Back to {patient.name.split(" ")[0]}&rsquo;s narrative
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <h1 style={{ fontSize: 28 }}>Dynamic monitoring plan</h1>
        <AiBadge />
      </div>
      <p style={{ fontSize: 15, color: "var(--soft)", margin: "0 0 22px" }}>{patient.name} · {patient.condition}. The clinician is the final approver of any change.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Previous frequency</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 600, marginTop: 5 }}>{patient.monitoringPlan}</div>
        </div>
        <div style={{ background: "var(--teal-50)", border: "1px solid var(--teal-100)", borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 11, color: "var(--teal)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Current recommendation</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 600, marginTop: 5, color: "var(--teal-d)" }}>{OPTIONS.find((o) => o.id === choice)?.label}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 9, background: "var(--amber-100)", borderRadius: 12, padding: "13px 16px", marginBottom: 24 }}>
        <Icon d={P.alertCircle} size={18} color="var(--amber-d)" stroke={1.7} style={{ flex: "none", marginTop: 1 }} />
        <span style={{ fontSize: 13.5, color: "var(--amber-d)", lineHeight: 1.5 }}><b>Reason:</b> Functional change awaiting clinician review. More frequent check-ins help confirm whether the change is persistent.</span>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--soft)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Choose the monitoring frequency</div>
      {OPTIONS.map((o) => {
        const on = choice === o.id;
        return (
          <button key={o.id} onClick={() => { setChoice(o.id); setApproved(false); }} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", background: on ? "var(--teal-50)" : "var(--card)", border: `1.5px solid ${on ? "var(--teal)" : "var(--line)"}`, borderRadius: 13, padding: "15px 17px", marginBottom: 10, cursor: "pointer", transition: "all .12s" }}>
            <span style={{ width: 22, height: 22, flex: "none", borderRadius: "50%", border: `2px solid ${on ? "var(--teal)" : "var(--neutral-400)"}`, background: on ? "var(--teal)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {on && <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff" }} />}
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 15.5, fontWeight: 600, color: "var(--ink)" }}>{o.label}</span>
              <span style={{ display: "block", fontSize: 13, color: "var(--soft)", marginTop: 2 }}>{o.sub}</span>
            </span>
            {o.rec && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--teal-d)", background: "var(--teal-100)", padding: "3px 9px", borderRadius: 20 }}>Recommended</span>}
          </button>
        );
      })}

      <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", marginTop: 20 }}>
        <Avatar initials="RP" soft size={38} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Dr Ravi Patel is the final approver</div>
          <div style={{ fontSize: 12.5, color: "var(--soft)" }}>The plan updates only when you approve it.</div>
        </div>
        <button onClick={approve} className="btn-teal press" style={{ flex: "none", padding: "13px 22px", fontSize: 14.5 }}>Approve plan</button>
      </div>

      {approved && (
        <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center", marginTop: 16, color: "var(--green-d)", fontWeight: 600, fontSize: 14 }}>
          <Icon d={P.check} size={18} color="var(--green-d)" stroke={2} /> Plan approved — {patient.name.split(" ")[0]} will be asked to check in: {OPTIONS.find((o) => o.id === choice)?.label.toLowerCase()}.
        </div>
      )}
    </div>
  );
}
