import { prisma } from "../../lib/prisma";
import { auth } from "../../auth";
import { addRisk } from "./actions";
import RiskRow from "./RiskRow";
import StatCards from "../components/StatCards";
import Pagination from "../components/Pagination";
import Link from "next/link";

const PAGE_SIZE = 8;

export default async function RisksPage({ searchParams }) {
  const session = await auth();
  const canEdit = session?.user?.role !== "donor";
  const params = await searchParams;
  const q = (params?.q || "").trim();
  const page = Math.max(1, parseInt(params?.page || "1", 10) || 1);

  const where = q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {};

  const [risks, totalCount, openCount, highCount, closedCount, projects] = await Promise.all([
    prisma.risk.findMany({
      where, orderBy: { id: "desc" }, include: { project: true },
      skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
    }),
    prisma.risk.count({ where }),
    prisma.risk.count({ where: { ...where, status: "Open" } }),
    prisma.risk.count({ where: { ...where, status: { not: "Closed" }, OR: [{ likelihood: "High" }, { impact: "High" }] } }),
    prisma.risk.count({ where: { ...where, status: "Closed" } }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageHref = (p) => `/risks?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`;
  const inputStyle = { padding: "8px 10px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13.5, width: "100%", boxSizing: "border-box" };

  return (
    <main style={{ margin: "0", padding: "40px 32px", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Risk Register</h1>
      <p style={{ color: "#665f52", fontSize: 13.5, marginBottom: 18 }}>
        {totalCount} risk{totalCount !== 1 ? "s" : ""} tracked{q ? ` matching "${q}"` : ""}
      </p>

      <StatCards
        cards={[
          { label: "Total risks", value: totalCount, color: "#1B3A5C" },
          { label: "Open", value: openCount, color: "#8C6414" },
          { label: "High priority", value: highCount, color: "#B8442D" },
          { label: "Closed", value: closedCount, color: "#5C7A3D" },
        ]}
      />

      {canEdit && (
        <form
          action={addRisk}
          className="form-grid"
          style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 18, marginBottom: 20 }}
        >
          <div style={{ gridColumn: "1 / -1", fontWeight: 700, fontSize: 14 }}>Log a risk</div>
          <input name="title" placeholder="Risk title" required style={{ ...inputStyle, gridColumn: "1 / -1" }} />
          <textarea name="description" placeholder="Description (optional)" style={{ ...inputStyle, gridColumn: "1 / -1", minHeight: 60 }} />
          <select name="likelihood" defaultValue="Medium" style={inputStyle}>
            <option>Low</option><option>Medium</option><option>High</option>
          </select>
          <select name="impact" defaultValue="Medium" style={inputStyle}>
            <option>Low</option><option>Medium</option><option>High</option>
          </select>
          <textarea name="mitigation" placeholder="Mitigation plan (optional)" style={{ ...inputStyle, gridColumn: "1 / -1", minHeight: 60 }} />
          <select name="projectId" defaultValue="" style={{ ...inputStyle, gridColumn: "1 / -1" }}>
            <option value="">No specific project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button type="submit" style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", gridColumn: "1 / -1", justifySelf: "start" }}>
            Save risk
          </button>
        </form>
      )}

      <form method="GET" style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <input type="text" name="q" defaultValue={q} placeholder="Search by title or description..." style={{ ...inputStyle, maxWidth: 320 }} />
        <button type="submit" style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>Search</button>
        {q && <Link href="/risks" style={{ display: "flex", alignItems: "center", fontSize: 12.5, color: "#665f52" }}>Clear</Link>}
      </form>

      {risks.length === 0 && (
        <div style={{ background: "#FBF8F2", border: "1px dashed #DED2BC", borderRadius: 10, padding: 30, textAlign: "center", color: "#665f52", fontSize: 13.5 }}>
          No matching risks.
        </div>
      )}
      {risks.map((r) => <RiskRow key={r.id} risk={r} projects={projects} canEdit={canEdit} />)}

      <Pagination page={page} totalPages={totalPages} buildHref={pageHref} />
    </main>
  );
}
