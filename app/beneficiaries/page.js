import { prisma } from "../../lib/prisma";
import { addBeneficiary } from "./actions";
import { auth } from "../../auth";
import BeneficiaryRow from "./BeneficiaryRow";
import Link from "next/link";
import StatCards from "../components/StatCards";
import Pagination from "../components/Pagination";
import TZ_DISTRICTS from "../../lib/tanzania-districts";

const PAGE_SIZE = 12;

export default async function BeneficiariesPage({ searchParams }) {
  const session = await auth();
  const canEdit = session?.user?.role !== "donor";
  const params = await searchParams;
  const q = (params?.q || "").trim();
  const page = Math.max(1, parseInt(params?.page || "1", 10) || 1);

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { district: { contains: q, mode: "insensitive" } },
          { sector: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [beneficiaries, totalCount, projects] = await Promise.all([
    prisma.beneficiary.findMany({
      where,
      orderBy: { id: "desc" },
      include: { project: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.beneficiary.count({ where }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
  ]);
  const districts = [...new Set(projects.map((p) => p.district))].sort();
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const totalLinked = await prisma.beneficiary.count({ where: { ...where, projectId: { not: null } } });
  const femaleCount = await prisma.beneficiary.count({ where: { ...where, sex: "Female" } });
  const femalePct = totalCount > 0 ? Math.round((femaleCount / totalCount) * 100) : 0;

  const cellStyle = { padding: "8px 10px", borderBottom: "1px solid #DED2BC", fontSize: 13.5 };
  const inputStyle = { padding: "7px 9px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13.5, width: "100%", boxSizing: "border-box" };

  const pageHref = (p) => `/beneficiaries?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`;

  return (
    <main style={{ margin: "0", padding: "40px 32px", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Beneficiary Database</h1>
      <p style={{ color: "#665f52", fontSize: 13.5, marginBottom: 18 }}>
        {totalCount} record{totalCount !== 1 ? "s" : ""}{q ? ` matching "${q}"` : ""}
      </p>

      <StatCards
        cards={[
          { label: "Total beneficiaries", value: totalCount, color: "#1B3A5C" },
          { label: "Districts covered", value: districts.length, color: "#2E7D8C" },
          { label: "Linked to a project", value: totalLinked, color: "#5C7A3D" },
          { label: "Female / Male split", value: `${femalePct}% / ${100 - femalePct}%`, color: "#D9A441" },
        ]}
      />

      {canEdit && (
        <form
          action={addBeneficiary}
          className="form-grid"
          style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 18, marginBottom: 20 }}
        >
          <div style={{ gridColumn: "1 / -1", fontWeight: 700, fontSize: 14 }}>Add beneficiary</div>
          <input name="name" placeholder="Full name" required style={inputStyle} />
          <input name="phone" placeholder="Phone number" style={inputStyle} />
          <select name="sex" style={inputStyle} defaultValue="Female">
            <option>Female</option>
            <option>Male</option>
          </select>
          <input name="age" type="number" placeholder="Age" style={inputStyle} />
          <select name="district" style={inputStyle} defaultValue="">
            <option value="">Select district</option>
            {TZ_DISTRICTS.map((r) => (
              <optgroup key={r.region} label={r.region}>
                {r.districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </optgroup>
            ))}
          </select>
          <select name="sector" style={inputStyle} defaultValue="education">
            <option value="education">Education</option>
            <option value="economic">Women's Economic Empowerment</option>
            <option value="rights">Rights & Leadership</option>
            <option value="health">Health</option>
            <option value="water">Water</option>
            <option value="climate">Climate Change</option>
          </select>
          <select name="projectId" style={{ ...inputStyle, gridColumn: "1 / -1" }} defaultValue="">
            <option value="">No specific project (optional)</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.district}</option>)}
          </select>
          <button
            type="submit"
            style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
          >
            Save record
          </button>
        </form>
      )}

      <form method="GET" style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name, district, or sector..."
          style={{ ...inputStyle, maxWidth: 320 }}
        />
        <button type="submit" style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>
          Search
        </button>
        {q && (
          <Link href="/beneficiaries" style={{ display: "flex", alignItems: "center", fontSize: 12.5, color: "#665f52" }}>
            Clear
          </Link>
        )}
      </form>

      <div className="table-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...cellStyle, textAlign: "left", opacity: 0.6, fontSize: 11 }}>Name</th>
              <th style={{ ...cellStyle, textAlign: "left", opacity: 0.6, fontSize: 11 }}>Phone</th>
              <th style={{ ...cellStyle, textAlign: "left", opacity: 0.6, fontSize: 11 }}>Sex</th>
              <th style={{ ...cellStyle, textAlign: "left", opacity: 0.6, fontSize: 11 }}>Age</th>
              <th style={{ ...cellStyle, textAlign: "left", opacity: 0.6, fontSize: 11 }}>District</th>
              <th style={{ ...cellStyle, textAlign: "left", opacity: 0.6, fontSize: 11 }}>Sector</th>
              <th style={{ ...cellStyle, textAlign: "left", opacity: 0.6, fontSize: 11 }}>Project</th>
              {canEdit && <th style={cellStyle}></th>}
            </tr>
          </thead>
          <tbody>
            {beneficiaries.length === 0 && (
              <tr><td colSpan={canEdit ? 8 : 7} style={{ ...cellStyle, textAlign: "center", opacity: 0.5 }}>No matching records.</td></tr>
            )}
            {beneficiaries.map((b) => (
              <BeneficiaryRow key={b.id} b={b} projects={projects} canEdit={canEdit} />
            ))}
          </tbody>
        </table>
      </div>

<Pagination page={page} totalPages={totalPages} buildHref={pageHref} />
    </main>
  );
}
