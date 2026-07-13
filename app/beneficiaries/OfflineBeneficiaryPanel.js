"use client";
import { useState } from "react";
import OfflineSyncManager from "./OfflineSyncManager";
import OfflineBeneficiaryForm from "./OfflineBeneficiaryForm";

export default function OfflineBeneficiaryPanel({ projects }) {
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <>
      <OfflineSyncManager refreshSignal={refreshSignal} />
      <OfflineBeneficiaryForm projects={projects} onQueued={() => setRefreshSignal((s) => s + 1)} />
    </>
  );
}
