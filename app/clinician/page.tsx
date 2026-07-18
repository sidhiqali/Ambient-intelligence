"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Icon, P } from "@/lib/icons";
import { Avatar, DemoBadge, PriorityPill } from "@/components/ui";
import { useStore } from "@/lib/store";
import { PRIORITY_META } from "@/lib/priority";
import { Priority } from "@/lib/types";

const PR_RANK: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

export default function Dashboard() {
  const router = useRouter();
  const { patients } = useStore();
  const queue = [...patients].sort((a, b) => PR_RANK[a.priority] - PR_RANK[b.priority]);
  const awaiting = patients.filter((p) => p.priority === "High").length;

  const metrics = [
    { value: "86%", label: "Check-in completion", bg: "var(--teal-100)", fg: "var(--teal-d)", icon: P.check },
    { value: "9", label: "Meaningful changes identified", bg: "var(--amber-100)", fg: "var(--amber-d)", icon: P.activity },
    { value: "4", label: "Missed check-ins", bg: "var(--orange-100)", fg: "var(--orange-d)", icon: P.alertCircle },
    { value: String(awaiting), label: "Patients awaiting review", bg: "var(--red-100)", fg: "var(--red-d)", icon: P.user },
  ];
  const activity = [
    { label: "Completed check-ins", value: "52", bg: "var(--teal-100)", fg: "var(--teal-d)", icon: P.check },
    { label: "Missed check-ins", value: "4", bg: "var(--orange-100)", fg: "var(--orange-d)", icon: P.x },
    { label: "New functional changes", value: "6", bg: "var(--amber-100)", fg: "var(--amber-d)", icon: P.trendUp },
    { label: "Medication concerns", value: "3", bg: "var(--amber-100)", fg: "var(--amber-d)", icon: P.pill },
    { label: "Measurements requested", value: "11", bg: "var(--teal-100)", fg: "var(--teal-d)", icon: P.gauge },
    { label: "Clinician reviews initiated", value: "8", bg: "var(--green-100)", fg: "var(--green-d)", icon: P.shield },
  ];

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }} className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--soft)", fontWeight: 600 }}>Tuesday, 12 May · Chronic-care monitoring</div>
          <h1 style={{ fontSize: 30, marginTop: 3 }}>Good morning, Dr Patel</h1>
        </div>
        <DemoBadge />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 26 }}>
        {metrics.map((m, i) => (
          <div key={i} className="card hover-lift" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ width: 34, height: 34, borderRadius: 9, background: m.bg, color: m.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={m.icon} size={18} color={m.fg} stroke={1.7} />
              </span>
              <span className="mono-tag">DEMO</span>
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 600, color: m.fg, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 13, color: "var(--soft)", marginTop: 5 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <h2 style={{ fontSize: 19 }}>Patients requiring attention</h2>
            <span style={{ fontSize: 12.5, color: "var(--teal-d)", fontWeight: 600 }}>Review priority · not a diagnosis</span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--faint)", margin: "0 0 14px" }}>Ordered by review priority. The clinician confirms every action.</p>

          {queue.map((p) => {
            const meta = PRIORITY_META[p.priority];
            const isHigh = p.priority === "High";
            return (
              <div key={p.id} className="hover-lift" style={{ border: `1px solid ${isHigh ? "var(--orange-100)" : "var(--line)"}`, borderLeft: `4px solid ${meta.accent}`, borderRadius: 12, padding: 15, marginBottom: 12, background: isHigh ? "var(--orange-100)" : "var(--card)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <Avatar initials={p.initials} color={meta.accent} soft={!isHigh} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</span>
                      <PriorityPill priority={p.priority} full />
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--soft)", marginTop: 1 }}>{p.condition} · Last check-in {p.lastCheckin}</div>
                  </div>
                  <button onClick={() => router.push(`/clinician/patient/${p.id}`)} className={isHigh ? "btn-teal press" : "btn-ghost press"} style={{ flex: "none", padding: "9px 15px", fontSize: 13.5 }}>Open patient</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 13, paddingTop: 13, borderTop: "1px solid var(--line2)" }}>
                  <Field label="Change from baseline" value={p.changeFromBaseline} />
                  <Field label="Next recommended action" value={p.nextAction} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 19, marginBottom: 3 }}>Between-appointment activity</h2>
          <p style={{ fontSize: 12.5, color: "var(--faint)", margin: "0 0 14px" }}>This week · demo data</p>
          {activity.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: i ? "1px solid var(--line2)" : "none" }}>
              <span style={{ width: 30, height: 30, flex: "none", borderRadius: 8, background: a.bg, color: a.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={a.icon} size={16} color={a.fg} stroke={1.7} />
              </span>
              <span style={{ flex: 1, fontSize: 13.5, color: "var(--soft)" }}>{a.label}</span>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 600 }}>{a.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
      <div style={{ fontSize: 13.5, color: "var(--ink)", marginTop: 2 }}>{value}</div>
    </div>
  );
}
