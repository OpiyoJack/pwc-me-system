"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { addBeneficiary } from "./actions";
import { getQueuedBeneficiaries, removeQueuedBeneficiary, countQueuedBeneficiaries } from "../../lib/offline-db";

export default function OfflineSyncManager({ refreshSignal }) {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    setPendingCount(await countQueuedBeneficiaries());
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    const queued = await getQueuedBeneficiaries();
    for (const record of queued) {
      try {
        const fd = new FormData();
        Object.entries(record).forEach(([k, v]) => { if (k !== "localId" && k !== "savedAt") fd.set(k, v); });
        await addBeneficiary(fd);
        await removeQueuedBeneficiary(record.localId);
      } catch {
        // Stop on first failure (likely offline again) — remaining items stay queued for next attempt
        break;
      }
    }
    await refreshCount();
    setSyncing(false);
    router.refresh();
  }, [syncing, refreshCount, router]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshCount();

    const goOnline = () => { setIsOnline(true); syncNow(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshSignal, refreshCount]);

  if (pendingCount === 0 && isOnline) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, background: "#F3EDE0", border: "1px solid #DED2BC",
      borderRadius: 8, padding: "10px 14px", marginBottom: 16, flexWrap: "wrap",
    }}>
      {!isOnline && (
        <span style={{ fontSize: 12, fontWeight: 700, color: "#8C6414" }}>📴 You're offline</span>
      )}
      {pendingCount > 0 && (
        <>
          <span style={{ fontSize: 12, color: "#665f52" }}>
            <strong>{pendingCount}</strong> beneficiary record{pendingCount !== 1 ? "s" : ""} saved offline, waiting to sync
          </span>
          {isOnline && (
            <button
              onClick={syncNow}
              disabled={syncing}
              style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {syncing ? "Syncing..." : "Sync now"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
