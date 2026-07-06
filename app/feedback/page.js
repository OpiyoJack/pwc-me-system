import { prisma } from "../../lib/prisma";
import { addFeedback } from "./actions";
import { auth } from "../../auth";
import FeedbackRow from "./FeedbackRow";
import Link from "next/link";
import StatCards from "../components/StatCards";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 10;

export default async function FeedbackPage({ searchParams }) {
  const session = await auth();
  const canEdit = session?.user?.role !== "donor";
  const params = await searchParams;
  const q = (params?.q || "").trim();
  const page = Math.max(1, parseInt(params?.page || "1", 10) || 1);

  const where = q
    ? { OR: [{ note: { contains: q, mode: "insensitive" } }, { district: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] }
    : {};

  const [feedback, totalCount, openCount, projects] = await Promise.all([
    prisma.feedback.findMany({
      where, orderBy: { id: "desc" }, include: { project: true },
      skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
    }),
    prisma.feedback.count({ where }),
    prisma.feedback.count({ where: { status: "Open" } }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
  ]);
  const districts = [...new Set(projects.map((p) => p.district))].sort();
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageHref = (p) => `/feedback?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`;
  const complaintCount = await prisma.feedback.count({ where: { ...where, category: "Complaint" } });
  const resolvedCount = await prisma.feedback.count({ where: { ...where, status: "Resolved" } });

  const inputStyle = { padding: "7px 9px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13.5, width: "100%", boxSizing: "border-box" };

  return (
    <main style={{ margin: "0", padding: "40px 32px", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Feedback & Accountability</h1>
      <p style={{ color: "#665f52", fontSize: 13.5, marginBottom: 18 }}>
        {openCount} open of {totalCount} total{q ? ` matching "${q}"` : ""}
      </p>

      <StatCards
        cards={[
          { label: "Total logged", value: totalCount, color: "#1B3A5C" },
          { label: "Open", value: openCount, color: "#8C6414" },
          { label: "Resolved", value: resolvedCount, color: "#5C7A3D" },
          { label: "Complaints", value: complaintCount, color: "#B8442D" },
        ]}
      />

      <form
        action={addFeedback}
        className="form-grid"
        style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 18, marginBottom: 20 }}
      >
        <div style={{ gridColumn: "1 / -1", fontWeight: 700, fontSize: 14 }}>Log feedback or complaint</div>
        <select name="category" style={inputStyle} defaultValue="Feedback">
          <option>Feedback</option><option>Suggestion</option><option>Complaint</option>
        </select>
        <select name="district" style={inputStyle} defaultValue={districts[0] || ""}>
          {districts.length === 0 && <option value="">No projects yet</option>}
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select name="projectId" style={{ ...inputStyle, gridColumn: "1 / -1" }} defaultValue="">
          <option value="">No specific project (optional)</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.district}</option>)}
        </select>
        <textarea name="note" placeholder="Details" required style={{ ...inputStyle, gridColumn: "1 / -1", minHeight: 70 }} />
        <button type="submit" style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", gridColumn: "1 / -1", justifySelf: "start" }}>
          Submit
        </button>
      </form>

      <form method="GET" style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <input type="text" name="q" defaultValue={q} placeholder="Search by note, category, or district..." style={{ ...inputStyle, maxWidth: 320 }} />
        <button type="submit" style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>Search</button>
        {q && <Link href="/feedback" style={{ display: "flex", alignItems: "center", fontSize: 12.5, color: "#665f52" }}>Clear</Link>}
      </form>

      <div style={{ display: "grid", gap: 10 }}>
        {feedback.length === 0 && (
          <div style={{ background: "#FBF8F2", border: "1px dashed #DED2BC", borderRadius: 10, padding: 24, textAlign: "center", color: "#665f52", fontSize: 13.5 }}>
            No matching feedback.
          </div>
        )}
        {feedback.map((f) => <FeedbackRow key={f.id} f={f} canEdit={canEdit} />)}
      </div>

<Pagination page={page} totalPages={totalPages} buildHref={pageHref} />
    </main>
  );
}
