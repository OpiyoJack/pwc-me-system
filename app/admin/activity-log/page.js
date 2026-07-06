import { prisma } from "../../../lib/prisma";
import { auth } from "../../../auth";
import { hasPermission } from "../../../lib/permissions";

export default async function ActivityLogPage({ searchParams }) {
  const session = await auth();
  const canView = session?.user?.role === "admin" || hasPermission(session?.user, "can_manage_staff");

  if (!canView) {
    return (
      <main style={{ maxWidth: 700, margin: "0", padding: "60px 20px", fontFamily: "sans-serif" }}>
        <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 30, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Access restricted</div>
          <div style={{ fontSize: 13.5, color: "#665f52" }}>You don't have permission to view the activity log.</div>
        </div>
      </main>
    );
  }

  const params = await searchParams;
  const q = (params?.q || "").trim().toLowerCase();
  const page = Math.max(1, parseInt(params?.page || "1", 10) || 1);
  const PAGE_SIZE = 30;

  const where = q ? { OR: [{ userName: { contains: q, mode: "insensitive" } }, { action: { contains: q, mode: "insensitive" } }, { details: { contains: q, mode: "insensitive" } }] } : {};
  const [logs, totalCount] = await Promise.all([
    prisma.activityLog.findMany({ where, orderBy: { id: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.activityLog.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const cellStyle = { padding: "9px 14px", borderBottom: "1px solid #DED2BC", fontSize: 13 };
  const headStyle = { ...cellStyle, textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "#665f52", background: "#F3EDE0" };

  const actionColor = (action) => {
    if (action === "Login") return { bg: "#E4EBD9", fg: "#5C7A3D" };
    if (action === "Logout") return { bg: "#DDE6EE", fg: "#2E7D8C" };
    if (action.toLowerCase().includes("delete") || action.toLowerCase().includes("removed")) return { bg: "#F3DCD4", fg: "#B8442D" };
    return { bg: "#F6E7CC", fg: "#8C6414" };
  };

  return (
    <main style={{ margin: "0", padding: "40px 32px", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Activity Log</h1>
      <p style={{ color: "#665f52", fontSize: 13.5, marginBottom: 18 }}>
        {totalCount} recorded event{totalCount !== 1 ? "s" : ""} — every login, logout, and key action taken in the system.
      </p>

      <form method="GET" style={{ marginBottom: 16 }}>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by user, action, or details..."
          style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13.5, width: 300, maxWidth: "100%" }}
        />
      </form>

      <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={headStyle}>When</th>
              <th style={headStyle}>User</th>
              <th style={headStyle}>Action</th>
              <th style={headStyle}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={4} style={{ ...cellStyle, textAlign: "center", fontStyle: "italic", color: "#665f52" }}>No activity recorded yet.</td></tr>
            )}
            {logs.map((l) => {
              const c = actionColor(l.action);
              return (
                <tr key={l.id}>
                  <td style={cellStyle}>{new Date(l.createdAt).toISOString().slice(0, 16).replace("T", " ")}</td>
                  <td style={cellStyle}>{l.userName}</td>
                  <td style={cellStyle}><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: c.bg, color: c.fg }}>{l.action}</span></td>
                  <td style={cellStyle}>{l.details || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {page > 1 && <a href={`?q=${encodeURIComponent(q)}&page=${page - 1}`} style={{ fontSize: 12.5, padding: "6px 11px", border: "1px solid #DED2BC", borderRadius: 6, textDecoration: "none", color: "#241D18" }}>← Prev</a>}
          <span style={{ fontSize: 12.5, color: "#665f52", padding: "6px 0" }}>Page {page} of {totalPages}</span>
          {page < totalPages && <a href={`?q=${encodeURIComponent(q)}&page=${page + 1}`} style={{ fontSize: 12.5, padding: "6px 11px", border: "1px solid #DED2BC", borderRadius: 6, textDecoration: "none", color: "#241D18" }}>Next →</a>}
        </div>
      )}
    </main>
  );
}
