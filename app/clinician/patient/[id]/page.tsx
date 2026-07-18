"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon, P } from "@/lib/icons";
import { Avatar, AiBadge, PriorityPill } from "@/components/ui";
import { useStore } from "@/lib/store";
import { computePriority, PRIORITY_META } from "@/lib/priority";
import { FALLBACK_ANALYSIS, SARAH_NARRATIVE } from "@/lib/seed";
import { Priority } from "@/lib/types";
import { TriageReview } from "@/components/triageReview";

const secHead: React.CSSProperties = { display: "flex", alignItems: "center", gap: 11, fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 600, marginBottom: 12 };
const secBadgeStyle: React.CSSProperties = { width: 26, height: 26, flex: "none", borderRadius: 8, background: "var(--teal)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" };
const SecBadge = ({ children }: any) => <span style={secBadgeStyle}>{children}</span>;

export default function PatientNarrative() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getPatient, setPriority } = useStore();
  const patient = getPatient(id);

  if (!patient) return <div>Patient not found.</div>;
  if (patient.id !== "sarah") return <SimpleNarrative patient={patient} />;

  return <SarahNarrative patient={patient} router={router} setPriority={setPriority} />;
}

function SarahNarrative({ patient, router, setPriority }: any) {
  const N = SARAH_NARRATIVE;
  const latest = patient.checkins.find((c: any) => !c.seeded);
  const flags = latest?.analysis?.flags ?? FALLBACK_ANALYSIS.flags;
  const pr = computePriority(flags);
  const priority: Priority = patient.priority;
  const meta = PRIORITY_META[priority];
  const summary = latest?.analysis?.summary ?? FALLBACK_ANALYSIS.summary;
  const missing = latest?.analysis?.missingInfo?.length ? latest.analysis.missingInfo : N.missing;
  const imageFinding = latest?.analysis?.imageFinding;
  const imageDataUrl = latest?.imageDataUrl;
  const liveChanges: string[] | null = latest?.analysis?.changes?.length ? latest.analysis.changes : null;

  const [selObs, setSelObs] = useState<string | null>(null);
  const [selEvent, setSelEvent] = useState("followup");
  const [correction, setCorrection] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2600); };
  const activeQuote = N.currDefs.find((d) => d.obs === selObs)?.quote;
  const eventDetail = N.timeline.find((e) => e.id === selEvent) || N.timeline[6];

  const kindStyle = (k: string) => {
    const map: any = { plan: ["var(--teal-100)", "var(--teal-d)"], symptom: ["var(--amber-100)", "var(--amber-d)"], change: ["var(--orange-100)", "var(--orange-d)"], ai: ["var(--teal-100)", "var(--teal-d)"], review: ["var(--red-100)", "var(--red-d)"] };
    const [bg, fg] = map[k] || map.plan;
    return { fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".04em", color: fg, background: bg, padding: "2px 7px", borderRadius: 5 };
  };
  const kindLabel: any = { plan: "Plan", symptom: "Symptom", change: "Change", ai: "AI follow-up", review: "Review" };

  const actions = [
    { label: "Confirm review priority", onClick: () => flash(`Priority confirmed as ${priority}`) },
    { label: "Increase priority", onClick: () => { setPriority("sarah", "High"); flash("Priority increased to High"); } },
    { label: "Reduce priority", onClick: () => { setPriority("sarah", "Medium"); flash("Priority reduced to Medium"); } },
    { label: "Request additional measurement", onClick: () => router.push("/clinician/monitoring/sarah") },
    { label: "Schedule next check-in", onClick: () => router.push("/clinician/monitoring/sarah") },
    { label: "Correct AI interpretation", onClick: () => setCorrection(true) },
  ];

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }} className="fade-in">
      <button onClick={() => router.push("/clinician")} className="hover-teal" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--soft)", fontSize: 13, fontWeight: 600, padding: "0 0 14px" }}>
        <Icon d={P.chevronLeft} size={15} color="currentColor" stroke={1.7} /> Patient queue
      </button>

      {/* header */}
      <div className="card" style={{ borderTop: `4px solid ${meta.accent}`, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
          <Avatar initials={patient.initials} color={meta.accent} size={56} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 27 }}>{patient.name}</h1>
              <AiBadge />
              {latest?.analysis?.source === "openai" && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--teal-d)", background: "var(--teal-50)", border: "1px solid var(--teal-100)", padding: "3px 9px", borderRadius: 20 }}>Live AI · {latest.mode}</span>}
            </div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 11 }}>
              {N.patientFacts.map((f) => (
                <div key={f.k}>
                  <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{f.k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{f.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: "none", textAlign: "right" }}>
            <PriorityPill priority={priority} full />
            <div style={{ fontSize: 13, color: meta.fg, fontWeight: 700, marginTop: 9 }}>{meta.note}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 20, alignItems: "start" }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* A. what changed */}
          <div className="card" style={{ padding: 22 }}>
            <div style={secHead}><SecBadge>A</SecBadge>What changed since the previous check-in</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 6 }}>
              <div style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ background: "var(--wash)", padding: "9px 14px", fontSize: 12, fontWeight: 700, color: "var(--soft)", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--line)" }}>Previous state</div>
                <div style={{ padding: "6px 8px" }}>
                  {N.prevState.map((d, i) => (
                    <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: 8, fontSize: 14, lineHeight: 1.4, color: "var(--soft)" }}>
                      <span style={{ color: "var(--faint)", flex: "none", marginTop: 1 }}>–</span><span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ border: "1px solid var(--orange-100)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ background: "var(--orange-100)", padding: "9px 14px", fontSize: 12, fontWeight: 700, color: "var(--orange-d)", textTransform: "uppercase", letterSpacing: ".05em" }}>Current state</div>
                <div style={{ padding: "6px 8px" }}>
                  {liveChanges
                    ? liveChanges.map((text, i) => (
                        <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: 8, fontSize: 14, lineHeight: 1.4, color: "var(--ink)" }}>
                          <span style={{ flex: "none", marginTop: 1, fontWeight: 700, color: "var(--orange-d)" }}>+</span>
                          <span style={{ flex: 1 }}>{text}</span>
                        </div>
                      ))
                    : N.currDefs.map((d) => {
                        const active = selObs === d.obs;
                        return (
                          <div key={d.obs} onClick={() => d.quote && setSelObs(d.obs)}
                            style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: 8, fontSize: 14, lineHeight: 1.4, borderRadius: 8, cursor: d.quote ? "pointer" : "default", color: "var(--ink)", background: active ? "var(--teal-100)" : "transparent", transition: "background .12s" }}>
                            <span style={{ flex: "none", marginTop: 1, fontWeight: 700, color: d.changed ? "var(--orange-d)" : "var(--faint)" }}>{d.changed ? "+" : "•"}</span>
                            <span style={{ flex: 1 }}>{d.text}</span>
                            {d.quote && <Icon d={P.quote} size={14} color="var(--teal)" stroke={1.7} style={{ flex: "none", marginTop: 2 }} />}
                          </div>
                        );
                      })}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon d={P.quote} size={13} color="var(--faint)" stroke={1.7} /> Items with a marker link to supporting evidence below. Change identified — not a condition detected.
            </div>
          </div>

          {/* B. baseline */}
          <div className="card" style={{ padding: 22 }}>
            <div style={secHead}><SecBadge>B</SecBadge>Personal baseline comparison</div>
            <p style={{ fontSize: 12.5, color: "var(--faint)", margin: "0 0 14px" }}>Compared against {patient.name.split(" ")[0]}&rsquo;s own previous pattern — not against other patients.</p>
            {N.baseline.map((b) => {
              const dir = b.dir === "decline" ? { t: "Declined", bg: "var(--orange-100)", fg: "var(--orange-d)", ic: P.arrowDown } : b.dir === "worse" ? { t: "Worsened", bg: "var(--amber-100)", fg: "var(--amber-d)", ic: P.arrowDown } : { t: "Stable", bg: "var(--green-100)", fg: "var(--green-d)", ic: P.check };
              return (
                <div key={b.dim} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 14, marginBottom: 11 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600 }}>{b.dim}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: dir.fg, background: dir.bg, padding: "3px 10px", borderRadius: 20 }}>
                      <Icon d={dir.ic} size={12} color={dir.fg} stroke={2.2} />{dir.t}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div><div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Usual</div><div style={{ fontSize: 13.5, color: "var(--soft)", marginTop: 2 }}>{b.usual}</div></div>
                    <div><div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Current</div><div style={{ fontSize: 13.5, color: "var(--ink)", marginTop: 2 }}>{b.current}</div></div>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--teal-d)", marginTop: 10, paddingTop: 9, borderTop: "1px dashed var(--line)", fontStyle: "italic" }}>Evidence: {b.evidence}</div>
                </div>
              );
            })}
          </div>

          {/* C. timeline */}
          <div className="card" style={{ padding: 22 }}>
            <div style={secHead}><SecBadge>C</SecBadge>Continuous clinical narrative</div>
            <p style={{ fontSize: 12.5, color: "var(--faint)", margin: "0 0 16px" }}>Select an event to see detail.</p>
            <div style={{ position: "relative", paddingLeft: 6 }}>
              {N.timeline.map((e, i) => {
                const active = selEvent === e.id;
                return (
                  <button key={e.id} onClick={() => setSelEvent(e.id)} style={{ display: "flex", gap: 13, width: "100%", background: active ? "var(--teal-50)" : "transparent", border: "none", borderRadius: 9, padding: "4px 8px", cursor: "pointer", transition: "background .12s" }}>
                    <span style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                      <span style={{ width: 13, height: 13, borderRadius: "50%", marginTop: 3, flex: "none", background: active ? "var(--teal)" : "var(--card)", border: `2px solid ${active ? "var(--teal)" : "var(--neutral-400)"}`, boxShadow: active ? "0 0 0 3px var(--teal-100)" : "none" }} />
                      {i < N.timeline.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 14, background: "var(--line)" }} />}
                    </span>
                    <span style={{ flex: 1, textAlign: "left", paddingBottom: 12 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{e.label}</span>
                        <span style={kindStyle(e.kind)}>{kindLabel[e.kind]}</span>
                      </span>
                      <span style={{ display: "block", fontSize: 12, color: "var(--faint)", marginTop: 1 }}>{e.when}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ background: "var(--teal-50)", border: "1px solid var(--teal-100)", borderRadius: 12, padding: "14px 16px", marginTop: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{eventDetail.label} · {eventDetail.when}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink)" }}>{eventDetail.note}</div>
            </div>
          </div>

          {/* G. evidence */}
          <div className="card" style={{ padding: 22 }}>
            <div style={secHead}><SecBadge>G</SecBadge>Evidence from the conversation</div>
            <p style={{ fontSize: 12.5, color: "var(--faint)", margin: "0 0 14px" }}>Select an observation above or a quote below — each observation links to the exact patient statement.</p>
            {N.quotes.map((q) => {
              const active = activeQuote === q.id || selObs === q.obs;
              return (
                <button key={q.id} onClick={() => setSelObs(q.obs)} style={{ display: "flex", gap: 11, width: "100%", textAlign: "left", background: active ? "var(--teal-50)" : "var(--wash)", border: `1px solid ${active ? "var(--teal)" : "var(--line)"}`, borderRadius: 12, padding: "13px 15px", marginBottom: 10, cursor: "pointer", transition: "all .12s" }}>
                  <Icon d={P.quote} size={20} color={active ? "var(--teal)" : "var(--neutral-300)"} stroke={1.7} style={{ flex: "none", marginTop: 1 }} />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 15, lineHeight: 1.45, color: "var(--ink)", fontStyle: "italic" }}>&ldquo;{q.text}&rdquo;</span>
                    <span style={{ display: "block", fontSize: 12, color: active ? "var(--teal-d)" : "var(--faint)", fontWeight: 600, marginTop: 5 }}>Supports: {q.supports}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 20 }}>
          <TriageReview patient={patient} />
          {/* D. summary */}
          <div style={{ background: "linear-gradient(180deg,var(--teal-50),var(--card))", border: "1px solid var(--teal-100)", borderRadius: 16, padding: 22 }}>
            <div style={secHead}><SecBadge>D</SecBadge>AI-generated clinical summary</div>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink)", margin: "6px 0 0" }}>{summary}</p>
            {imageDataUrl && (
              <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <img src={imageDataUrl} alt="shared" style={{ width: 84, height: 84, borderRadius: 10, objectFit: "cover", flex: "none", border: "1px solid var(--line)" }} />
                <div style={{ fontSize: 13, color: "var(--soft)", lineHeight: 1.5 }}>{imageFinding || "Patient-shared image attached to this check-in."}</div>
              </div>
            )}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--card)", border: "1px solid var(--teal-100)", color: "var(--teal-d)", borderRadius: 20, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, marginTop: 14 }}>
              <Icon d={P.ai} size={13} color="var(--teal-d)" stroke={1.8} /> AI-generated draft for clinician review
            </div>
          </div>

          {/* F. why priority */}
          <div className="card" style={{ padding: 22 }}>
            <div style={secHead}><SecBadge>F</SecBadge>Why this review priority?</div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, background: meta.bg, borderRadius: 11, padding: "11px 14px", margin: "6px 0 15px" }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: meta.accent }} />
              <span style={{ fontWeight: 700, color: meta.fg, fontSize: 15 }}>{meta.label}</span>
            </div>
            <ReasonList title="Reasons this was raised" items={pr.raiseReasons} icon={P.arrowUp} color="var(--orange)" />
            <ReasonList title="Factors reducing immediate concern" items={pr.lowerReasons} icon={P.arrowDown} color="var(--green)" />
            <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 13, paddingTop: 12, borderTop: "1px solid var(--line2)", lineHeight: 1.5 }}>These are transparent rules applied to the evidence. Ambient Intelligence does not make the final clinical decision.</div>
          </div>

          {/* E. known/resolved/missing */}
          <div className="card" style={{ padding: 22 }}>
            <div style={secHead}><SecBadge>E</SecBadge>Known, resolved &amp; missing</div>
            <Group title="Known" color="var(--green-d)" items={N.known} render={(k) => <><span style={{ color: "var(--green)", flex: "none" }}>✓</span><span>{k}</span></>} />
            <Group title="Resolved today" color="var(--teal-d)" items={N.resolved} muted render={(k) => <><span style={{ color: "var(--teal)", flex: "none" }}>✓</span><span>{k}</span></>} />
            <Group title="Still missing" color="var(--amber-d)" items={missing} muted render={(k) => <><Icon d={P.alertCircle} size={15} color="var(--amber)" stroke={2} style={{ flex: "none", marginTop: 1 }} /><span>{k}</span></>} />
            <button onClick={() => router.push("/clinician/monitoring/sarah")} className="btn-ghost press" style={{ width: "100%", marginTop: 15, padding: 12, fontSize: 14 }}>Request home measurement</button>
          </div>
        </div>
      </div>

      {/* H. actions bar */}
      <div style={{ position: "sticky", bottom: 0, marginTop: 22, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 20px", boxShadow: "0 -6px 20px -12px rgba(20,35,45,.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--soft)", textTransform: "uppercase", letterSpacing: ".05em" }}>Clinician actions</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
            {actions.map((a, i) => (
              <button key={i} onClick={a.onClick} className="hover-teal" style={{ background: "var(--wash)", border: "1px solid var(--line)", borderRadius: 9, padding: "9px 13px", fontSize: 13, fontWeight: 600, color: "var(--ink)", transition: "all .12s" }}>{a.label}</button>
            ))}
          </div>
          <button onClick={() => router.push("/clinician/monitoring/sarah")} className="btn-teal press" style={{ flex: "none", padding: "12px 22px", fontSize: 14.5 }}>Review &amp; update plan →</button>
        </div>
      </div>

      {toast && (
        <div className="fade-up" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "#fff", padding: "13px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 9, zIndex: 200, boxShadow: "0 16px 40px -12px rgba(20,35,45,.5)" }}>
          <Icon d={P.check} size={17} color="#fff" stroke={2} /> {toast}
        </div>
      )}

      {correction && <CorrectionModal onClose={() => setCorrection(false)} />}
    </div>
  );
}

function ReasonList({ title, items, icon, color }: { title: string; items: string[]; icon: string; color: string }) {
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--soft)", textTransform: "uppercase", letterSpacing: ".05em", margin: "8px 0" }}>{title}</div>
      {items.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "7px 0", fontSize: 13.5, lineHeight: 1.4 }}>
          <Icon d={icon} size={16} color={color} stroke={2} style={{ flex: "none", marginTop: 1 }} /><span>{r}</span>
        </div>
      ))}
    </>
  );
}

function Group({ title, color, items, render, muted }: any) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".05em", margin: "8px 0 7px" }}>{title}</div>
      {items.map((k: string, i: number) => (
        <div key={i} style={{ display: "flex", gap: 8, fontSize: 13.5, padding: "5px 0", lineHeight: 1.4, color: muted ? "var(--soft)" : "var(--ink)" }}>{render(k)}</div>
      ))}
    </div>
  );
}

function CorrectionModal({ onClose }: { onClose: () => void }) {
  const opts = [
    { id: "accurate", label: "Observation is accurate" },
    { id: "partial", label: "Observation is partially accurate" },
    { id: "incorrect", label: "Observation is incorrect" },
    { id: "normal", label: "This is normal for this patient" },
    { id: "missing", label: "Important context is missing" },
  ];
  const [choice, setChoice] = useState("partial");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,35,45,.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 300, animation: "fadeIn .18s" }} onClick={onClose}>
      <div className="fade-up" onClick={(e) => e.stopPropagation()} style={{ background: "var(--card)", borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 30px 80px -20px rgba(20,35,45,.5)" }}>
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "flex-start", gap: 13 }}>
          <div style={{ width: 40, height: 40, flex: "none", borderRadius: 11, background: "var(--teal-100)", color: "var(--teal-d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={P.edit} size={21} color="var(--teal-d)" stroke={1.7} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 21 }}>Correct the AI interpretation</h2>
            <p style={{ fontSize: 13.5, color: "var(--soft)", margin: "3px 0 0" }}>Your correction becomes part of this patient&rsquo;s monitoring context.</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ flex: "none", background: "none", border: "none", color: "var(--faint)", padding: 4 }}>
            <Icon d={P.x} size={22} color="currentColor" stroke={1.8} />
          </button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--soft)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 11 }}>How accurate is the observation?</div>
          {opts.map((o) => {
            const on = choice === o.id;
            return (
              <button key={o.id} onClick={() => setChoice(o.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: on ? "var(--teal-50)" : "var(--card)", border: `1.5px solid ${on ? "var(--teal)" : "var(--line)"}`, borderRadius: 11, padding: "13px 15px", marginBottom: 9, cursor: "pointer", transition: "all .12s" }}>
                <span style={{ width: 20, height: 20, flex: "none", borderRadius: "50%", border: `2px solid ${on ? "var(--teal)" : "var(--neutral-400)"}`, background: on ? "var(--teal)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {on && <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#fff" }} />}
                </span>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{o.label}</span>
              </button>
            );
          })}
          <div style={{ display: "flex", gap: 9, background: "var(--teal-50)", border: "1px solid var(--teal-100)", borderRadius: 12, padding: "13px 15px", marginTop: 16 }}>
            <Icon d={P.info} size={17} color="var(--teal)" stroke={1.7} style={{ flex: "none", marginTop: 1 }} />
            <span style={{ fontSize: 13, color: "var(--teal-d)", lineHeight: 1.5 }}>This correction updates the patient-specific monitoring context. It does not automatically retrain the underlying model.</span>
          </div>
        </div>
        <div style={{ padding: "16px 24px 22px", display: "flex", gap: 11, justifyContent: "flex-end", borderTop: "1px solid var(--line)" }}>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "12px 20px", fontSize: 14.5 }}>Cancel</button>
          <button onClick={onClose} className="btn-teal" style={{ padding: "12px 22px", fontSize: 14.5 }}>Save correction</button>
        </div>
      </div>
    </div>
  );
}

function SimpleNarrative({ patient }: any) {
  const meta = PRIORITY_META[patient.priority];
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }} className="fade-in">
      <a href="/clinician" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--soft)", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
        <Icon d={P.chevronLeft} size={15} color="currentColor" stroke={1.7} /> Patient queue
      </a>
      <div className="card" style={{ borderTop: `4px solid ${meta.accent}`, padding: 24, marginBottom: 20, display: "flex", gap: 16, alignItems: "center" }}>
        <Avatar initials={patient.initials} color={meta.accent} size={52} soft={patient.priority !== "High"} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24 }}>{patient.name}</h1>
          <div style={{ fontSize: 13.5, color: "var(--soft)" }}>{patient.condition} · {patient.medication}</div>
        </div>
        <PriorityPill priority={patient.priority} full />
      </div>
      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={secHead}><SecBadge>i</SecBadge>Current picture</div>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>
          {patient.name.split(" ")[0]} is currently <b>{patient.priority.toLowerCase()}</b> priority. {patient.changeFromBaseline}. Recommended next step: {patient.nextAction.toLowerCase()}.{patient.isNew ? " Awaiting the first check-in to establish a baseline." : ""}
        </p>
      </div>

      <div style={{ marginBottom: 20 }}><TriageReview patient={patient} /></div>

      {patient.plan && (
        <div className="card" style={{ padding: 22 }}>
          <div style={secHead}><SecBadge>P</SecBadge>Monitoring plan</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div style={{ background: "var(--teal-50)", border: "1px solid var(--teal-100)", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: "var(--teal)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Initial close monitoring</div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 600, marginTop: 4, color: "var(--teal-d)" }}>{patient.plan.initialFrequencyDays} days, daily</div>
            </div>
            <div style={{ background: "var(--wash)", border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: "var(--soft)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Regular frequency</div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 600, marginTop: 4 }}>{patient.plan.regularFrequency}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--soft)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Biomarkers the AI is watching · {patient.plan.metrics.length}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {patient.plan.metrics.map((m: any) => (
              <span key={m.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, background: "var(--wash)", border: "1px solid var(--line)", borderRadius: 20, padding: "5px 11px" }}>
                {m.label}
                {(m.min != null || m.max != null) && (
                  <span style={{ fontSize: 11, color: "var(--teal-d)", fontWeight: 700 }}>{m.min != null ? `<${m.min}` : ""}{m.min != null && m.max != null ? " / " : ""}{m.max != null ? `>${m.max}` : ""} {m.unit}</span>
                )}
                {m.rule && <span style={{ fontSize: 10, color: "var(--orange-d)", fontWeight: 700 }}>⚠</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
