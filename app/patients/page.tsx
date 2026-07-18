"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon, P } from "@/lib/icons";
import { Logo, Avatar, PriorityPill } from "@/components/ui";
import { useStore } from "@/lib/store";
import { APP_NAME } from "@/lib/seed";
import { PRIORITY_META } from "@/lib/priority";

export default function PatientPicker() {
  const router = useRouter();
  const { patients, setActivePatient } = useStore();

  const open = (id: string) => { setActivePatient(id); router.push("/patient"); };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(900px 400px at 90% -20%, var(--teal-50), transparent), var(--bg)" }}>
      <header style={{ position: "sticky", top: 0, background: "rgba(255,255,255,.82)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/" style={{ color: "inherit" }}><Logo name={APP_NAME} size={28} /></Link>
        <Link href="/clinician/new" className="btn-ghost" style={{ marginLeft: "auto", padding: "8px 13px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icon d={P.plus} size={15} color="var(--teal-d)" stroke={2} /> New patient
        </Link>
      </header>

      <main style={{ maxWidth: 620, margin: "0 auto", padding: "26px 20px 60px" }}>
        <h1 style={{ fontSize: 27, marginBottom: 4 }}>Who&rsquo;s checking in?</h1>
        <p style={{ fontSize: 14.5, color: "var(--soft)", margin: "0 0 22px" }}>Choose a profile to open their app. Patients your clinician enrols appear here automatically.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {patients.map((p) => {
            const meta = PRIORITY_META[p.priority];
            return (
              <button key={p.id} onClick={() => open(p.id)} className="hover-lift press"
                style={{ display: "flex", alignItems: "center", gap: 15, textAlign: "left", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: 16, cursor: "pointer" }}>
                <Avatar initials={p.initials} color={meta.accent} soft={p.priority !== "High"} size={50} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 17, fontWeight: 600 }}>{p.name}</span>
                    {p.isNew && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--teal-d)", background: "var(--teal-100)", padding: "2px 8px", borderRadius: 20 }}>New</span>}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--soft)", marginTop: 2 }}>{p.condition}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                    <PriorityPill priority={p.priority} />
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--amber-d)", fontWeight: 600 }}>
                      <Icon d={P.activity} size={13} color="var(--amber-d)" stroke={1.9} /> {p.streak || 0}-day streak
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--teal-d)", fontSize: 13.5, fontWeight: 600, flex: "none" }}>
                  Open <Icon d={P.chevronRight} size={16} color="var(--teal-d)" stroke={1.8} />
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
