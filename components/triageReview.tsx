"use client";

import React, { useState } from "react";
import { Icon, P } from "@/lib/icons";
import { useStore } from "@/lib/store";
import { PRIORITY_META } from "@/lib/priority";

export function TriageReview({ patient }: { patient: any }) {
  const { setPriority } = useStore();
  const latest = patient.checkins?.find((c: any) => !c.seeded);
  const priority = patient.priority as "Low" | "Medium" | "High";
  const firstName = patient.name.split(" ")[0];
  const confidence = { High: 91, Medium: 74, Low: 88 }[priority];
  const summary =
    latest?.analysis?.summary ||
    `Recent monitoring flagged this patient as ${priority.toLowerCase()} priority based on their check-ins and connected-device signals — matching your care-plan rules.`;
  const patientStated =
    latest?.transcript || (priority === "High" ? "Feeling fine, no different" : "About the same as usual");
  const aiDetected =
    latest?.analysis?.changes && latest.analysis.changes.length
      ? latest.analysis.changes.slice(0, 2).join(" · ")
      : priority === "High"
      ? "Breathlessness · rapid weight gain"
      : priority === "Medium"
      ? "Signal drift from baseline"
      : "No change from baseline";

  const [decision, setDecision] = useState<string>("");

  const pill =
    priority === "High"
      ? { bg: "var(--red-100)", fg: "var(--red-d)" }
      : priority === "Medium"
      ? { bg: "var(--amber-100)", fg: "var(--amber-d)" }
      : { bg: "var(--green-100)", fg: "var(--green-d)" };

  const detectedColor = priority === "High" ? "var(--red-d)" : priority === "Medium" ? "var(--amber-d)" : "var(--soft)";

  const ghost: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 10,
    color: "var(--ink)",
    padding: "10px 14px",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all .12s",
  };

  const changeButtons: { label: string; icon: string; to: "Low" | "Medium" | "High"; decision: string }[] =
    priority === "High"
      ? [{ label: "Lower to medium", icon: P.arrowDown, to: "Medium", decision: "lowered" }]
      : priority === "Medium"
      ? [
          { label: "Raise to high", icon: P.arrowUp, to: "High", decision: "raised" },
          { label: "Lower to low", icon: P.arrowDown, to: "Low", decision: "lowered" },
        ]
      : [{ label: "Raise to medium", icon: P.arrowUp, to: "Medium", decision: "raised" }];

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 600 }}>AI triage review</div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            fontSize: 12.5,
            fontWeight: 700,
            color: pill.fg,
            background: pill.bg,
            padding: "5px 12px",
            borderRadius: 20,
          }}
        >
          {priority} · {confidence}%
        </span>
      </div>

      <div
        style={{
          background: "var(--wash)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "14px 16px",
          fontSize: 14.5,
          lineHeight: 1.6,
          color: "var(--ink)",
        }}
      >
        {summary}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "16px 0" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
            Patient stated
          </div>
          <div style={{ fontSize: 14, fontStyle: "italic", color: "var(--ink)", lineHeight: 1.5 }}>&ldquo;{patientStated}&rdquo;</div>
        </div>
        <div style={{ paddingLeft: 14, borderLeft: "1px solid var(--line)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
            AI detected
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: detectedColor, lineHeight: 1.5 }}>{aiDetected}</div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--soft)", margin: "0 0 11px" }}>Is this the right call?</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setPriority(patient.id, priority);
              setDecision("confirmed");
            }}
            style={{ ...ghost, background: "var(--green-100)", color: "var(--green-d)", border: "1px solid var(--green)" }}
          >
            <Icon d={P.check} size={16} color="var(--green-d)" stroke={2.2} /> Confirm {priority.toLowerCase()}
          </button>
          {changeButtons.map((b) => (
            <button
              key={b.label}
              onClick={() => {
                setPriority(patient.id, b.to);
                setDecision(b.decision);
              }}
              style={ghost}
            >
              <Icon d={b.icon} size={16} color="var(--soft)" stroke={2} /> {b.label}
            </button>
          ))}
          <button onClick={() => setDecision("calling")} style={ghost}>
            <Icon d={P.phone} size={16} color="var(--soft)" stroke={1.9} /> Call patient
          </button>
        </div>
      </div>

      {decision !== "" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 13, fontWeight: 600, color: "var(--green-d)" }}>
          <Icon d={P.check} size={15} color="var(--green-d)" stroke={2.2} />
          {decision === "confirmed"
            ? `Confirmed as ${priority} — plan unchanged.`
            : decision === "calling"
            ? "Connecting to the patient…"
            : "Priority updated — the patient's plan will adjust."}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 12,
          color: "var(--faint)",
          borderTop: "1px solid var(--line2)",
          paddingTop: 12,
          marginTop: 14,
        }}
      >
        <Icon d={P.refresh} size={13} color="var(--faint)" stroke={1.7} style={{ flex: "none" }} />
        Your decision trains the model&rsquo;s next classification for {firstName}.
      </div>
    </div>
  );
}
