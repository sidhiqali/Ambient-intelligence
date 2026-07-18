"use client";

import { useRouter } from "next/navigation";
import { EmergencyAlert } from "@/components/emergency";
import { useStore } from "@/lib/store";

export default function PatientEmergency() {
  const router = useRouter();
  const { getPatient, activePatientId } = useStore();
  const p = getPatient(activePatientId) || getPatient("sarah");

  return (
    <div style={{ padding: "20px 0" }}>
      <EmergencyAlert onHome={() => router.push("/patient")} />
    </div>
  );
}
