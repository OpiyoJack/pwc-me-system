"use client";
import { useSession, signOut } from "next-auth/react";
import { logLogout } from "../membership/actions";

export default function TopBar() {
  const { data: session } = useSession();

  if (!session) return null;

  const roleLabel = { admin: "Administrator", coordinator: "Coordinator", meofficer: "M&E Officer", donor: "Donor / Partner" }[session.user.role] || session.user.role;

  async function handleSignOut() {
    await logLogout();
    signOut({ callbackUrl: "/login" });
  }

  return (
    <div style={{
      display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12,
      padding: "14px 24px", borderBottom: "1px solid #DED2BC",
    }}>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{session.user.name}</div>
        <div style={{ fontSize: 11, opacity: 0.6 }}>{roleLabel}</div>
      </div>
      <button
        onClick={handleSignOut}
        style={{ background: "none", border: "1px solid #1B3A5C", color: "#1B3A5C", borderRadius: 6, padding: "6px 12px", fontSize: 12.5, cursor: "pointer" }}
      >
        Sign out
      </button>
    </div>
  );
}
