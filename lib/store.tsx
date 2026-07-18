"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Patient, Checkin, Priority } from "./types";
import { seedPatients } from "./seed";
import { computePriority } from "./priority";

type Role = "patient" | "clinician";

interface AutoCall {
  enabled: boolean;
  everyMinutes: number;
}

interface StoreShape {
  patients: Patient[];
  role: Role;
  activePatientId: string; // the patient using the app (always Sarah for the demo)
  autoCall: AutoCall;
  callRinging: boolean;
  hydrated: boolean;
}

interface StoreApi extends StoreShape {
  setRole: (r: Role) => void;
  getPatient: (id: string) => Patient | undefined;
  addCheckin: (patientId: string, c: Checkin) => void;
  answerFollowUp: (patientId: string, checkinId: string, answer: string) => void;
  setPriority: (patientId: string, p: Priority) => void;
  setMonitoringPlan: (patientId: string, plan: string) => void;
  toggleDevice: (patientId: string, deviceId: string) => void;
  addPatient: (p: Patient) => void;
  setActivePatient: (id: string) => void;
  giveConsent: (patientId: string) => void;
  setAutoCall: (patch: Partial<AutoCall>) => void;
  startRinging: () => void;
  stopRinging: () => void;
  reset: () => void;
}

const KEY = "ambient-intelligence-v2";
const Ctx = createContext<StoreApi | null>(null);

function initialState(): StoreShape {
  return { patients: seedPatients(), role: "patient", activePatientId: "sarah", autoCall: { enabled: false, everyMinutes: 1 }, callRinging: false, hydrated: false };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreShape>(initialState);
  const selfWrite = useRef<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState({ ...initialState(), ...parsed, callRinging: false, hydrated: true });
        return;
      }
    } catch {}
    setState((s) => ({ ...s, hydrated: true }));
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      const s = JSON.stringify(state);
      selfWrite.current = s;
      localStorage.setItem(KEY, s);
    } catch {}
  }, [state]);

  // Live sync across tabs/iframes (patient view <-> clinician view). Sync DATA only;
  // keep `role` and `callRinging` local to each view.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue || e.newValue === selfWrite.current) return;
      try {
        const incoming = JSON.parse(e.newValue);
        setState((prev) => ({ ...prev, patients: incoming.patients ?? prev.patients, activePatientId: incoming.activePatientId ?? prev.activePatientId, autoCall: incoming.autoCall ?? prev.autoCall }));
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const api: StoreApi = useMemo(() => {
    const update = (patientId: string, fn: (p: Patient) => Patient) =>
      setState((s) => ({ ...s, patients: s.patients.map((p) => (p.id === patientId ? fn(p) : p)) }));

    return {
      ...state,
      setRole: (r) => setState((s) => ({ ...s, role: r })),
      getPatient: (id) => state.patients.find((p) => p.id === id),
      addCheckin: (patientId, c) =>
        update(patientId, (p) => {
          if (c.analysis.unclear) {
            return { ...p, checkins: [c, ...p.checkins], lastCheckin: "just now", nextAction: "Check-in incomplete — retry requested" };
          }
          const pr = computePriority(c.analysis.flags);
          return {
            ...p,
            checkins: [c, ...p.checkins],
            streak: (p.streak || 0) + 1,
            priority: pr.priority,
            reviewRequested: pr.priority === "High",
            lastCheckin: "just now",
            changeFromBaseline: c.analysis.changes[0] || p.changeFromBaseline,
            nextAction: pr.priority === "High" ? "Same-day clinician review" : pr.priority === "Medium" ? "Request home measurement" : "Continue weekly check-ins",
          };
        }),
      answerFollowUp: (patientId, checkinId, answer) =>
        update(patientId, (p) => ({
          ...p,
          checkins: p.checkins.map((c) => (c.id === checkinId ? { ...c, followUpAnswer: answer } : c)),
        })),
      setPriority: (patientId, pr) => update(patientId, (p) => ({ ...p, priority: pr })),
      setMonitoringPlan: (patientId, plan) => update(patientId, (p) => ({ ...p, monitoringPlan: plan })),
      toggleDevice: (patientId, deviceId) =>
        update(patientId, (p) => ({
          ...p,
          devices: p.devices.map((d) => (d.id === deviceId ? { ...d, connected: !d.connected } : d)),
        })),
      addPatient: (p) => setState((s) => ({ ...s, patients: [...s.patients, p], activePatientId: p.id })),
      setActivePatient: (id) => setState((s) => ({ ...s, activePatientId: id })),
      giveConsent: (patientId) => update(patientId, (p) => ({ ...p, consented: true })),
      setAutoCall: (patch) => setState((s) => ({ ...s, autoCall: { ...s.autoCall, ...patch } })),
      startRinging: () => setState((s) => ({ ...s, callRinging: true })),
      stopRinging: () => setState((s) => ({ ...s, callRinging: false })),
      reset: () => setState({ ...initialState(), hydrated: true }),
    };
  }, [state]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used within StoreProvider");
  return c;
}
