"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, P } from "@/lib/icons";
import { Toggle } from "@/components/ui";
import { useStore } from "@/lib/store";
import { CATALOG, CATEGORIES } from "@/lib/metrics";
import { blankDevices } from "@/lib/seed";
import { MetricConfig, Patient } from "@/lib/types";

const FREQ = ["Daily", "Twice weekly", "Weekly", "Fortnightly"];
const CONDITIONS = ["Type 2 diabetes", "Hypertension", "Heart failure", "Obesity", "Cardiometabolic", "COPD"];

function initialMetrics(): MetricConfig[] {
  return CATALOG.map((c) => ({ key: c.key, label: c.label, category: c.category, unit: c.unit, enabled: !!c.core, min: c.min ?? null, max: c.max ?? null, rule: c.symptom ? "Alert clinician if reported" : undefined }));
}

export default function NewPatient() {
  const router = useRouter();
  const { addPatient } = useStore();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("Female");
  const [ethnicity, setEthnicity] = useState("");
  const [height, setHeight] = useState("");
  const [condition, setCondition] = useState("Type 2 diabetes");
  const [medication, setMedication] = useState("");
  const [initialDays, setInitialDays] = useState(14);
  const [regular, setRegular] = useState("Weekly");
  const [metrics, setMetrics] = useState<MetricConfig[]>(initialMetrics);
  const [saved, setSaved] = useState(false);

  const setMetric = (key: string, patch: Partial<MetricConfig>) =>
    setMetrics((m) => m.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const enabledCount = metrics.filter((m) => m.enabled).length;

  const canSave = name.trim().length > 1 && age;

  const save = () => {
    const parts = name.trim().split(/\s+/);
    const initials = (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
    const id = parts.join("-").toLowerCase().replace(/[^a-z-]/g, "") + "-" + String(name.length + Number(age));
    const patient: Patient = {
      id, name: name.trim(), initials, age: Number(age) || 0, sex, ethnicity, heightCm: Number(height) || undefined,
      condition, conditionShort: condition, medication: medication.trim() || "None recorded", adjustment: "Newly enrolled",
      monitoring: `${regular} check-ins`, clinician: "Dr R. Patel", priority: "Low",
      lastCheckin: "not yet", changeFromBaseline: "Awaiting first check-in", nextAction: "First check-in pending",
      monitoringPlan: regular, reviewRequested: false, isNew: true,
      plan: { initialFrequencyDays: initialDays, regularFrequency: regular, metrics: metrics.filter((m) => m.enabled) },
      checkins: [], devices: blankDevices(),
    };
    addPatient(patient);
    setSaved(true);
    setTimeout(() => router.push("/clinician"), 900);
  };

  return (
    <div style={{ maxWidth: 940, margin: "0 auto" }} className="fade-in">
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Add patient &amp; set up plan</h1>
      <p style={{ fontSize: 14.5, color: "var(--soft)", margin: "0 0 22px" }}>Enrol a patient, set adaptive monitoring, and choose which biomarkers the AI watches — with your thresholds.</p>

      {/* demographics */}
      <Card title="1 · Patient details">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
          <Field label="Full name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. James Okoro" style={inp} /></Field>
          <Field label="Age"><input value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} placeholder="58" style={inp} /></Field>
          <Field label="Sex at birth"><select value={sex} onChange={(e) => setSex(e.target.value)} style={inp}><option>Female</option><option>Male</option><option>Intersex</option></select></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12, marginTop: 12 }}>
          <Field label="Ethnicity"><input value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} placeholder="e.g. Black British" style={inp} /></Field>
          <Field label="Height (cm)"><input value={height} onChange={(e) => setHeight(e.target.value.replace(/\D/g, ""))} placeholder="172" style={inp} /></Field>
          <Field label="Condition"><select value={condition} onChange={(e) => setCondition(e.target.value)} style={inp}>{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select></Field>
        </div>
        <div style={{ marginTop: 12 }}>
          <Field label="Current medication"><input value={medication} onChange={(e) => setMedication(e.target.value)} placeholder="e.g. Metformin 1 g, Ramipril 5 mg" style={inp} /></Field>
        </div>
      </Card>

      {/* adaptive monitoring */}
      <Card title="2 · Adaptive monitoring">
        <p style={{ fontSize: 13, color: "var(--soft)", margin: "0 0 14px" }}>Check in more often at first, then step down to the regular cadence once stable.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "var(--teal-50)", border: "1px solid var(--teal-100)", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Initial close-monitoring window</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input value={initialDays} onChange={(e) => setInitialDays(Number(e.target.value.replace(/\D/g, "")) || 0)} style={{ ...inp, width: 80, fontSize: 20, fontWeight: 600, textAlign: "center" }} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>days</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--soft)", marginTop: 8 }}>Daily check-ins for the first {initialDays} days.</div>
          </div>
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--soft)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Regular frequency</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FREQ.map((f) => {
                const on = regular === f;
                return <button key={f} onClick={() => setRegular(f)} style={{ background: on ? "var(--teal)" : "var(--wash)", color: on ? "#fff" : "var(--ink)", border: `1px solid ${on ? "var(--teal)" : "var(--line)"}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{f}</button>;
              })}
            </div>
            <div style={{ fontSize: 12, color: "var(--soft)", marginTop: 10 }}>After the initial window, step down to {regular.toLowerCase()}.</div>
          </div>
        </div>
      </Card>

      {/* metrics */}
      <Card title="3 · Metrics, rules & thresholds">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: "var(--soft)", margin: 0 }}>Toggle the biomarkers the AI should watch and set alert thresholds. {enabledCount} enabled.</p>
        </div>
        {CATEGORIES.map((cat) => (
          <div key={cat} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--teal-d)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>{cat}</div>
            <div style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
              {metrics.filter((m) => m.category === cat).map((m, i) => {
                const isSymptom = m.rule === "Alert clinician if reported";
                return (
                  <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderTop: i ? "1px solid var(--line2)" : "none", background: m.enabled ? "var(--card)" : "var(--wash)" }}>
                    <Toggle on={m.enabled} onChange={() => setMetric(m.key, { enabled: !m.enabled })} size={24} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: m.enabled ? "var(--ink)" : "var(--faint)" }}>{m.label}</div>
                      {m.unit && <div style={{ fontSize: 11.5, color: "var(--faint)" }}>{m.unit}</div>}
                    </div>
                    {m.enabled && !isSymptom && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 600 }}>Alert if&nbsp;&lt;</span>
                        <input value={m.min ?? ""} onChange={(e) => setMetric(m.key, { min: e.target.value === "" ? null : Number(e.target.value) })} placeholder="—" style={thr} />
                        <span style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 600 }}>or&nbsp;&gt;</span>
                        <input value={m.max ?? ""} onChange={(e) => setMetric(m.key, { max: e.target.value === "" ? null : Number(e.target.value) })} placeholder="—" style={thr} />
                      </div>
                    )}
                    {m.enabled && isSymptom && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--orange-d)", background: "var(--orange-100)", padding: "3px 9px", borderRadius: 20 }}>Alert if reported</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </Card>

      {/* save bar */}
      <div style={{ position: "sticky", bottom: 0, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 -6px 20px -12px rgba(20,35,45,.25)", marginTop: 8 }}>
        <div style={{ fontSize: 13, color: "var(--soft)" }}>{enabledCount} biomarkers · {initialDays}-day initial window · {regular.toLowerCase()} thereafter</div>
        <button onClick={save} disabled={!canSave} className="btn-teal press" style={{ marginLeft: "auto", padding: "13px 24px", fontSize: 15, opacity: canSave ? 1 : 0.5, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon d={P.check} size={18} color="#fff" stroke={2} /> Enrol patient &amp; activate plan
        </button>
      </div>

      {saved && (
        <div className="fade-up" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "#fff", padding: "13px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 9, zIndex: 200 }}>
          <Icon d={P.check} size={17} color="#fff" stroke={2} /> {name.split(" ")[0]} enrolled — now live in the patient app.
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = { width: "100%", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px", fontSize: 14, outlineColor: "var(--teal)", background: "var(--card)" };
const thr: React.CSSProperties = { width: 54, border: "1px solid var(--line)", borderRadius: 7, padding: "5px 7px", fontSize: 13, textAlign: "center", outlineColor: "var(--teal)" };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 22, marginBottom: 16 }}>
      <h2 style={{ fontSize: 17, marginBottom: 14 }}>{title}</h2>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--soft)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
