import { prisma } from "../../lib/prisma";
import { auth } from "../../auth";
import UserRow from "./UserRow";
import AddUserWizard from "./AddUserWizard";
import StatCards from "../components/StatCards";
import { ROLE_DEFINITIONS } from "../../lib/roles";
import { hasPermission } from "../../lib/permissions";

export default async function StaffPage({ searchParams }) {
  const session = await auth();
  const canManageStaff = session?.user?.role === "admin" || hasPermission(session?.user, "can_manage_staff");

  if (!canManageStaff) {
    return (
      <main style={{ maxWidth: 700, margin: "0", padding: "60px 20px", fontFamily: "sans-serif" }}>
        <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 30, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Access restricted</div>
          <div style={{ fontSize: 13.5, color: "#665f52" }}>You don't have permission to manage staff and user accounts.</div>
        </div>
      </main>
    );
  }

  const params = await searchParams;
  const q = (params?.q || "").trim().toLowerCase();
  const statusFilter = params?.status || "all";

  const allUsers = await prisma.user.findMany({ orderBy: { id: "asc" } });
  let users = allUsers;
  if (q) users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  if (statusFilter === "active") users = users.filter((u) => u.active);
  if (statusFilter === "deactivated") users = users.filter((u) => !u.active);

  const inputStyle = { padding: "8px 10px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13.5, width: "100%", boxSizing: "border-box" };
  const cellStyle = { padding: "9px 10px", borderBottom: "1px solid #DED2BC", fontSize: 13.5 };

  const counts = {
    admin: allUsers.filter((u) => u.role === "admin").length,
    coordinator: allUsers.filter((u) => u.role === "coordinator").length,
    meofficer: allUsers.filter((u) => u.role === "meofficer").length,
    donor: allUsers.filter((u) => u.role === "donor").length,
  };
  const activeCount = allUsers.filter((u) => u.active).length;
  const deactivatedCount = allUsers.length - activeCount;

  return (
    <main style={{ margin: "0", padding: "40px 32px", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Staff & Users</h1>
      <p style={{ color: "#665f52", fontSize: 13.5, marginBottom: 18 }}>
        {allUsers.length} account{allUsers.length !== 1 ? "s" : ""} · {activeCount} active · {deactivatedCount} deactivated
      </p>

      <StatCards
        cards={[
          { label: "Administrators", value: counts.admin, color: "#B8442D" },
          { label: "Coordinators", value: counts.coordinator, color: "#5C7A3D" },
          { label: "M&E Officers", value: counts.meofficer, color: "#2E7D8C" },
          { label: "Donors / Partners", value: counts.donor, color: "#8C6414" },
        ]}
      />

      <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>What each role can do</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {Object.entries(ROLE_DEFINITIONS).map(([key, r]) => (
            <div key={key} style={{ fontSize: 12, background: "#F3EDE0", borderRadius: 8, padding: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 3 }}>{r.label}</div>
              <div style={{ color: "#665f52" }}>{r.description}</div>
            </div>
          ))}
        </div>
      </div>

      <AddUserWizard />

      <form method="GET" style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input type="text" name="q" defaultValue={q} placeholder="Search by name or email..." style={{ ...inputStyle, maxWidth: 260 }} />
        <select name="status" defaultValue={statusFilter} style={{ ...inputStyle, maxWidth: 180 }}>
          <option value="all">All users</option>
          <option value="active">Active only</option>
          <option value="deactivated">Deactivated only</option>
        </select>
        <button type="submit" style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>Filter</button>
      </form>

      <div className="table-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...cellStyle, textAlign: "left", opacity: 0.6, fontSize: 11 }}>Name</th>
              <th style={{ ...cellStyle, textAlign: "left", opacity: 0.6, fontSize: 11 }}>Email</th>
              <th style={{ ...cellStyle, textAlign: "left", opacity: 0.6, fontSize: 11 }}>Role</th>
              <th style={{ ...cellStyle, textAlign: "left", opacity: 0.6, fontSize: 11 }}>Status</th>
              <th style={{ ...cellStyle, textAlign: "left", opacity: 0.6, fontSize: 11 }}>Created</th>
              <th style={cellStyle}></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={6} style={{ ...cellStyle, textAlign: "center", opacity: 0.5 }}>No matching users.</td></tr>
            )}
            {users.map((u) => <UserRow key={u.id} u={u} currentUserId={Number(session.user.id)} />)}
          </tbody>
        </table>
      </div>
    </main>
  );
}
