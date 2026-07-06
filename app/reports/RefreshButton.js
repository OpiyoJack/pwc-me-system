"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  async function handleClick() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 700);
  }

  return (
    <button
      onClick={handleClick}
      disabled={refreshing}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #1B3A5C", color: "#1B3A5C", borderRadius: 6, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: refreshing ? "not-allowed" : "pointer" }}
    >
      {refreshing ? "Refreshing..." : "↻ Refresh Data"}
    </button>
  );
}
