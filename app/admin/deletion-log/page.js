import { prisma } from "../../../lib/prisma";
import { auth } from "../../../auth";

export default async function DeletionLogPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  if (!isAdmin) {
    return (
      <main style={{ maxWidth: 700, margin: "0", padding: "60px 20px", fontFamily: "sans-serif" }}>
        <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 30, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Access restricted</div>
          <div style={{ fontSize: 13.5, color: "#665f52" }}>Only Administrators can view the deletion log.</div>
        </div>
      </main>
    );
  }

  const logs = await prisma.deletionLog.findMany({ orderBy: { id: "desc" } });
  const cellStyle = { padding: "9px 14px", borderBottom: "1px solid #DED2BC", fontSize: 13 };
  const headStyle = { ...cellStyle, textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "#665f52", background: "#F3EDE0" };

  return (
    <main style={{ margin: "0", padding: "40px 32px", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Deletion Log</h1>
      <p style={{ color: "#665f52", fontSize: 13.5, marginBottom: 22 }}>
        A permanent record of every deletion performed in the system, for accountability.
      </p>

      <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={headStyle}>When</th>
              <th style={headStyle}>Type</th>
              <th style={headStyle}>Name</th>
              <th style={headStyle}>Reason</th>
              <th style={headStyle}>Deleted by</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={5} style={{ ...cellStyle, textAlign: "center", fontStyle: "italic", color: "#665f52" }}>No deletions recorded yet.</td></tr>
            )}
            {logs.map((l) => (
              <tr key={l.id}>
                <td style={cellStyle}>{new Date(l.deletedAt).toISOString().slice(0, 16).replace("T", " ")}</td>
                <td style={cellStyle}>{l.entityType}</td>
                <td style={cellStyle}>{l.entityName}</td>
                <td style={cellStyle}>{l.reason}</td>
                <td style={cellStyle}>{l.deletedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
