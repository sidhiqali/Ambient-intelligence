"use client";
import { ClinicianShell } from "@/components/shells";
export default function ClinicianLayout({ children }: { children: React.ReactNode }) {
  return <ClinicianShell>{children}</ClinicianShell>;
}
