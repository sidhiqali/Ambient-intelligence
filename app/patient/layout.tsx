"use client";
import { PatientShell } from "@/components/shells";
export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <PatientShell>{children}</PatientShell>;
}
