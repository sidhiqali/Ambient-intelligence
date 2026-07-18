"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Icon, P } from "@/lib/icons";
import { Logo } from "@/components/ui";
import { useStore } from "@/lib/store";
import { APP_NAME } from "@/lib/seed";

const patientSteps = [
  { n: 1, title: "Home & check-in", sub: "Your check-in is ready", href: "/patient" },
  { n: 2, title: "Multimodal check-in", sub: "Voice, video, photo or text", href: "/patient/checkin" },
  { n: 3, title: "Connected data", sub: "Watch, cuff, glucose, bloods", href: "/patient/devices" },
  { n: 4, title: "Your timeline", sub: "A simple record over time", href: "/patient/history" },
];
const clinicianSteps = [
  { n: 1, title: "Command dashboard", sub: "Prioritised patient queue", href: "/clinician" },
  { n: 2, title: "Clinical narrative", sub: "What changed · evidence · why", href: "/clinician/patient/sarah" },
  { n: 3, title: "Dynamic monitoring plan", sub: "Adaptive check-in frequency", href: "/clinician/monitoring/sarah" },
  { n: 4, title: "Between-appointment analytics", sub: "Care-team operations", href: "/clinician/analytics" },
];

export default function Launcher() {
  const router = useRouter();
  const { setRole } = useStore();
  const goPatient = (href: string) => { setRole("patient"); router.push(href); };
  const goClinician = (href: string) => { setRole("clinician"); router.push(href); };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 500px at 80% -10%, var(--teal-50), transparent), var(--bg)" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 28px 72px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <Logo name={APP_NAME} size={34} />
          <div style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--soft)", border: "1px solid var(--line)", background: "var(--card)", padding: "6px 12px", borderRadius: 20 }}>
            Interactive prototype · Demo data
          </div>
        </div>

        <div style={{ maxWidth: 780, animation: "fadeUp .4s" }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--teal)", marginBottom: 14 }}>
            Chronic-care monitoring, between appointments
          </div>
          <h1 style={{ fontSize: 46, lineHeight: 1.08, fontWeight: 600, marginBottom: 18 }}>
            Healthcare sees appointments.<br />
            <span style={{ color: "var(--teal)" }}>{APP_NAME}</span> understands what happens between them.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.55, color: "var(--soft)", maxWidth: 660 }}>
            An AI-assisted platform for chronic-care teams. Patients give brief, consented check-ins by call, voice, video, photo or text; clinicians receive an explainable view of what changed, the evidence behind it, and why a review was prioritised. The clinician always makes the decision.
          </p>
          <a href="/demo" className="press" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 22, background: "linear-gradient(135deg,var(--teal),var(--teal-d))", color: "#fff", borderRadius: 12, padding: "13px 20px", fontSize: 15, fontWeight: 700, boxShadow: "0 16px 34px -16px rgba(15,124,138,.7)" }}>
            <Icon d={P.activity} size={18} color="#fff" stroke={1.9} /> Open live split-screen demo
            <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, background: "rgba(255,255,255,.18)", padding: "2px 8px", borderRadius: 20 }}>Patient ⇄ Clinician, in sync</span>
          </a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 64px 1fr", marginTop: 44, alignItems: "stretch" }}>
          <RoleColumn
            icon={P.user}
            title="Patient experience"
            blurb="Calm, minimal, conversational. Under one minute per check-in."
            steps={patientSteps}
            onStep={goPatient}
            cta="Enter patient journey"
            onCta={() => goPatient("/patient")}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ width: 1, flex: 1, background: "linear-gradient(var(--line),transparent)" }} />
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--card)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--teal)" }}>
              <Icon d={P.arrowRight} size={22} color="var(--teal)" stroke={1.6} />
            </div>
            <div style={{ width: 1, flex: 1, background: "linear-gradient(transparent,var(--line))" }} />
          </div>
          <RoleColumn
            icon={P.chart}
            title="Clinician & operations"
            blurb="Information-rich and explainable. Evidence behind every observation."
            steps={clinicianSteps}
            onStep={goClinician}
            cta="Enter clinician journey"
            onCta={() => goClinician("/clinician")}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 30, alignItems: "center", color: "var(--soft)", fontSize: 13 }}>
          <TrustChip icon={P.shield} text="AI-assisted, never AI-controlled" />
          <TrustChip icon={P.check} text="Clinician is the final decision-maker" />
          <TrustChip icon={P.clock} text="Synthetic demo data throughout" />
        </div>
      </div>
    </div>
  );
}

function RoleColumn({ icon, title, blurb, steps, onStep, cta, onCta }: any) {
  return (
    <div className="card" style={{ padding: 26, animation: "fadeUp .5s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Icon d={icon} size={18} color="var(--teal)" stroke={1.6} />
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 19, fontWeight: 600 }}>{title}</div>
      </div>
      <p style={{ fontSize: 14, color: "var(--soft)", lineHeight: 1.5, margin: "0 0 18px" }}>{blurb}</p>
      {steps.map((s: any) => (
        <button key={s.n} onClick={() => onStep(s.href)} className="hoverline"
          style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", textAlign: "left", background: "var(--wash)", border: "1px solid var(--line)", borderRadius: 11, padding: "12px 14px", marginBottom: 9, transition: "all .12s" }}>
          <span style={{ width: 26, height: 26, flex: "none", borderRadius: 7, background: "var(--teal-100)", color: "var(--teal-d)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.n}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{s.title}</span>
            <span style={{ display: "block", fontSize: 12.5, color: "var(--soft)" }}>{s.sub}</span>
          </span>
          <Icon d={P.chevronRight} size={16} color="var(--faint)" stroke={1.6} />
        </button>
      ))}
      <button onClick={onCta} className="btn-teal" style={{ marginTop: 8, width: "100%", padding: 14, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {cta} <Icon d={P.arrowRight} size={17} color="#fff" stroke={1.9} />
      </button>
    </div>
  );
}

function TrustChip({ icon, text }: { icon: string; text: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--card)", border: "1px solid var(--line)", padding: "7px 12px", borderRadius: 20 }}>
      <Icon d={icon} size={14} color="var(--teal)" stroke={1.7} />
      {text}
    </span>
  );
}
