"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { hasPermission } from "../../lib/permissions";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects & Indicators" },
  { href: "/beneficiaries", label: "Beneficiaries" },
  { href: "/membership", label: "Staff & Users", check: (u) => u.role === "admin" || hasPermission(u, "can_manage_staff") },
  { href: "/risks", label: "Risk Register" },
  { href: "/feedback", label: "Feedback & Accountability" },
  { href: "/import", label: "Import Data", check: (u) => ["admin", "coordinator", "meofficer"].includes(u.role) || hasPermission(u, "can_import_data") },
  { href: "/admin/deletion-log", label: "Deletion Log", check: (u) => u.role === "admin" || hasPermission(u, "can_manage_staff") },
  { href: "/admin/activity-log", label: "Activity Log", check: (u) => u.role === "admin" || hasPermission(u, "can_manage_staff") },
  { href: "/analytics", label: "Analytics" },
  { href: "/reports", label: "Reports" },
  { href: "/security", label: "Security" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  if (pathname === "/login") return null;

  const visibleNav = NAV.filter((item) => {
    if (!item.check) return true; // no restriction — everyone with an account can see it
    if (!session?.user) return false; // session not loaded yet — hide restricted items until we know
    return item.check(session.user);
  });

  return (
    <aside className="pwc-sidebar"
      style={{
        width: 230,
        background: "#12283F",
        color: "#F3EEE3",
        padding: "22px 14px",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 6px", marginBottom: 20 }}>
        <img src="/pwc-logo.png" alt="PWC logo" style={{ width: 34, height: 34, objectFit: "contain", flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.15 }}>PWC</div>
          <div style={{ fontSize: 9.5, opacity: 0.6, letterSpacing: "0.05em" }}>M&E PLATFORM</div>
        </div>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {visibleNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                padding: "9px 10px",
                borderRadius: 7,
                fontSize: 13.5,
                textDecoration: "none",
                color: active ? "#fff" : "rgba(243,238,227,0.75)",
                background: active ? "rgba(255,255,255,0.1)" : "transparent",
                fontWeight: active ? 600 : 500,
                borderLeft: active ? "3px solid #D9A441" : "3px solid transparent",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
