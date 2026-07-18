"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon, P } from "@/lib/icons";
import { Logo, Avatar } from "@/components/ui";
import { AutoCallControl, AutoCallHost } from "@/components/autocall";
import { useStore } from "@/lib/store";
import { APP_NAME } from "@/lib/seed";

function RoleSwitch({ to }: { to: "patient" | "clinician" }) {
  const router = useRouter();
  const { setRole } = useStore();
  const label = to === "clinician" ? "Clinician view" : "Patient view";
  const icon = to === "clinician" ? P.chart : P.user;
  return (
    <button
      onClick={() => { setRole(to); router.push(to === "clinician" ? "/clinician" : "/patient"); }}
      className="hover-teal"
      style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 20, padding: "7px 13px", fontSize: 13, fontWeight: 600, color: "var(--soft)", transition: "all .12s" }}
    >
      <Icon d={P.refresh} size={14} color="currentColor" stroke={1.7} />
      Switch to {label}
    </button>
  );
}

const patientTabs = [
  { label: "Home", href: "/patient", icon: P.home },
  { label: "Check-in", href: "/patient/checkin", icon: P.mic },
  { label: "Connected data", href: "/patient/devices", icon: P.activity },
  { label: "Timeline", href: "/patient/history", icon: P.calendar },
];

function useEmbed() {
  const [embed, setEmbed] = useState(false);
  useEffect(() => { try { setEmbed(window.self !== window.top); } catch { setEmbed(true); } }, []);
  return embed;
}

export function PatientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const embed = useEmbed();
  const { getPatient, activePatientId } = useStore();
  const patient = getPatient(activePatientId);
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1000px 420px at 90% -20%, var(--teal-50), transparent), var(--bg)" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,.82)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: embed ? "10px 14px" : "12px 22px", display: "flex", alignItems: "center", gap: embed ? 6 : 18 }}>
          <Link href="/patient" style={{ color: "inherit" }}><Logo name={APP_NAME} size={embed ? 26 : 28} showName={!embed} /></Link>
          <nav style={{ display: "flex", gap: embed ? 2 : 4, marginLeft: embed ? 0 : 14 }}>
            {patientTabs.map((t) => {
              const active = t.href === "/patient" ? pathname === "/patient" : pathname.startsWith(t.href);
              return (
                <Link key={t.href} href={t.href} title={t.label} className={active ? "" : "nav-item"}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: embed ? "8px 9px" : "8px 13px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, color: active ? "var(--teal-d)" : "var(--soft)", background: active ? "var(--teal-50)" : "transparent", transition: "all .12s" }}>
                  <Icon d={t.icon} size={16} color="currentColor" stroke={active ? 1.9 : 1.6} />
                  {!embed && t.label}
                </Link>
              );
            })}
          </nav>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: embed ? 8 : 12 }}>
            <AutoCallControl />
            {!embed && <RoleSwitch to="clinician" />}
            <Link href="/patients" title="Switch profile" style={{ display: "flex" }}><Avatar initials={patient?.initials || "SM"} soft size={embed ? 34 : 38} /></Link>
          </div>
        </div>
      </header>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "26px 22px 60px" }}>{children}</main>
      <AutoCallHost />
    </div>
  );
}

const clinicianNav = [
  { label: "Overview", href: "/clinician", icon: P.home },
  { label: "Add patient & plan", href: "/clinician/new", icon: P.plus },
  { label: "Monitoring plans", href: "/clinician/monitoring/sarah", icon: P.clock },
  { label: "Analytics", href: "/clinician/analytics", icon: P.chart },
];

export function ClinicianShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const embed = useEmbed();
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg)" }}>
      <aside style={{ width: 236, flex: "none", background: "var(--card)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", padding: "20px 14px", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "4px 8px 20px" }}>
          <Link href="/clinician" style={{ color: "inherit" }}><Logo name={APP_NAME} size={28} /></Link>
        </div>
        {clinicianNav.map((n, i) => {
          const active =
            (n.href === "/clinician" && pathname === "/clinician") ||
            (n.href !== "/clinician" && pathname.startsWith(n.href.split("/sarah")[0]));
          return (
            <Link key={i} href={n.href} className={active ? "" : "nav-item"}
              style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", background: active ? "var(--teal-50)" : "transparent", color: active ? "var(--teal-d)" : "var(--soft)", borderRadius: 9, padding: "10px 12px", fontSize: 14, fontWeight: 600, marginBottom: 2, transition: "all .12s" }}>
              <Icon d={n.icon} size={18} color="currentColor" stroke={active ? 1.9 : 1.6} />
              {n.label}
            </Link>
          );
        })}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="wash" style={{ borderRadius: 12, padding: 13, display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar initials="RP" soft size={34} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Dr Ravi Patel</div>
              <div style={{ fontSize: 11.5, color: "var(--soft)" }}>Chronic-care team</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ height: 64, flex: "none", borderBottom: "1px solid var(--line)", background: "var(--card)", display: "flex", alignItems: "center", gap: 16, padding: "0 26px", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ flex: 1, maxWidth: 420, display: "flex", alignItems: "center", gap: 9, background: "var(--wash)", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 13px", color: "var(--faint)" }}>
            <Icon d={P.search} size={16} color="currentColor" stroke={1.7} />
            <span style={{ fontSize: 13.5 }}>Search patients, check-ins, plans</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            {!embed && <RoleSwitch to="patient" />}
            <div style={{ position: "relative", color: "var(--soft)" }}>
              <Icon d={P.bell} size={20} color="currentColor" stroke={1.6} />
              <span style={{ position: "absolute", top: -3, right: -3, width: 15, height: 15, borderRadius: "50%", background: "var(--orange)", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
            </div>
            <Avatar initials="RP" soft size={36} />
          </div>
        </header>
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 30px 48px" }}>{children}</div>
      </div>
    </div>
  );
}
