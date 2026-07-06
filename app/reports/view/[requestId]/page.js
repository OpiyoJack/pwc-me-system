import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../../auth";
import { resolveReportScope } from "../../../../lib/report-scope";
import { getReportById } from "../../../../lib/report-catalog";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buildFrameworkPath } from "../../../../lib/framework-path";

const SECTOR_LABELS = {
  education: "Education", economic: "Women's Economic Empowerment", rights: "Rights & Leadership",
  health: "Health", water: "Water", climate: "Climate Change",
};

export default async function ReportViewPage({ params }) {
  const { requestId } = await params;
  const session = await auth();
  const rr = await prisma.reportRequest.findUnique({ where: { id: Number(requestId) } });
  if (!rr) notFound();

  const isDonor = session?.user?.role === "donor";
  const currentUserId = session?.user?.id ? Number(session.user.id) : null;
  const { allowedProjects, scopedProjectIds } = await resolveReportScope(session, rr.projectId ? String(rr.projectId) : "all");
  const allowedProjectIds = allowedProjects.map((p) => p.id);

  // Same visibility rule as the queue list: donors can only view their own
  // requests, or requests explicitly scoped to one of their own projects.
  if (isDonor && rr.requestedById !== currentUserId && !(rr.projectId && allowedProjectIds.includes(rr.projectId))) {
    notFound();
  }

  const report = getReportById(rr.reportType);
  const dateWhere = {};
  if (rr.startDate) dateWhere.gte = rr.startDate;
  if (rr.endDate) dateWhere.lte = rr.endDate;

  const periodLabel = rr.startDate || rr.endDate
    ? `${rr.startDate ? rr.startDate.toISOString().slice(0, 10) : "Start"} to ${rr.endDate ? rr.endDate.toISOString().slice(0, 10) : "Present"}`
    : "All time";
  const scopeLabel = rr.projectName || `${scopedProjectIds.length} project(s) in scope`;

  const cardStyle = { background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 20, marginBottom: 16 };

  let body;

  if (rr.reportType === "beneficiaries") {
    const beneficiaries = await prisma.beneficiary.findMany({
      where: { projectId: { in: scopedProjectIds }, ...(Object.keys(dateWhere).length ? { enrolled: dateWhere } : {}) },
      include: { project: true }, orderBy: { id: "desc" },
    });
    body = (
      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Beneficiaries ({beneficiaries.length})</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Name", "Phone", "Sex", "Age", "District", "Sector", "Project"].map((h) => <th key={h} style={{ textAlign: "left", padding: "7px 10px", fontSize: 11, textTransform: "uppercase", color: "#665f52", borderBottom: "1px solid #DED2BC" }}>{h}</th>)}</tr></thead>
            <tbody>
              {beneficiaries.map((b) => (
                <tr key={b.id}>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #EDE6D8" }}>{b.name}</td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #EDE6D8" }}>{b.phone || "—"}</td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #EDE6D8" }}>{b.sex}</td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #EDE6D8" }}>{b.age}</td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #EDE6D8" }}>{b.district}</td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #EDE6D8" }}>{b.sector}</td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #EDE6D8" }}>{b.project ? b.project.name : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

  } else if (rr.reportType === "risks") {
    const risks = await prisma.risk.findMany({
      where: { projectId: { in: scopedProjectIds }, ...(Object.keys(dateWhere).length ? { createdAt: dateWhere } : {}) },
      include: { project: true }, orderBy: { id: "desc" },
    });
    const lvl = { Low: "#5C7A3D", Medium: "#8C6414", High: "#B8442D" };
    body = (
      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Risks ({risks.length})</div>
        <div style={{ display: "grid", gap: 10 }}>
          {risks.map((r) => (
            <div key={r.id} style={{ background: "#F3EDE0", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{r.title}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: lvl[r.impact] }}>{r.impact} impact · {r.status}</span>
              </div>
              {r.description && <div style={{ fontSize: 12.5, color: "#241D18", marginBottom: 4 }}>{r.description}</div>}
              {r.mitigation && <div style={{ fontSize: 12, color: "#665f52" }}><strong>Mitigation:</strong> {r.mitigation}</div>}
              <div style={{ fontSize: 11.5, color: "#665f52", marginTop: 4 }}>{r.project ? r.project.name : "No linked project"}</div>
            </div>
          ))}
        </div>
      </div>
    );

  } else if (rr.reportType === "feedback") {
    const feedback = await prisma.feedback.findMany({
      where: { projectId: { in: scopedProjectIds }, ...(Object.keys(dateWhere).length ? { createdAt: dateWhere } : {}) },
      include: { project: true }, orderBy: { id: "desc" },
    });
    body = (
      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Feedback & complaints ({feedback.length})</div>
        <div style={{ display: "grid", gap: 8 }}>
          {feedback.map((f) => (
            <div key={f.id} style={{ background: "#F3EDE0", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13 }}>{f.note}</div>
              <div style={{ fontSize: 11, color: "#665f52", whiteSpace: "nowrap" }}>{f.category} · {f.status} · {f.district}</div>
            </div>
          ))}
        </div>
      </div>
    );

  } else if (rr.reportType === "projects_indicators") {
    const projects = await prisma.project.findMany({
      where: { id: { in: scopedProjectIds } },
      include: { indicators: true, coordinator: true, donorContact: true, frameworkNodes: true },
    });
    body = (
      <>
        {projects.map((p) => (
          <div key={p.id} style={cardStyle}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: "#665f52", marginBottom: 12 }}>
              {SECTOR_LABELS[p.sector] || p.sector} · {p.district} · Status: {p.status} · Coordinator: {p.coordinator ? p.coordinator.name : "Unassigned"} · Donor: {p.donorContact ? p.donorContact.name : "Unassigned"}
            </div>
            {p.indicators.map((i) => {
              const pct = i.target > 0 ? Math.round((i.actual / i.target) * 100) : 0;
              const color = pct >= 80 ? "#5C7A3D" : pct >= 40 ? "#D9A441" : "#B8442D";
              const fPath = buildFrameworkPath(p.frameworkNodes, i.frameworkNodeId);
              return (
                <div key={i.id} style={{ marginBottom: 10 }}>
                  {fPath && <div style={{ fontSize: 10.5, color: "#8C6414", marginBottom: 2 }}>{fPath}</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span>{i.name}</span>
                    <span style={{ fontWeight: 700 }}>{i.actual}/{i.target} {i.unit} ({pct}%)</span>
                  </div>
                  <div style={{ background: "#EDE6D8", borderRadius: 6, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(pct, 100)}%`, background: color, height: "100%" }} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </>
    );

  } else {
    const [projects, beneficiaryCount, feedbackList] = await Promise.all([
      prisma.project.findMany({ where: { id: { in: scopedProjectIds } }, include: { indicators: true, frameworkNodes: true } }),
      prisma.beneficiary.count({ where: { projectId: { in: scopedProjectIds }, ...(Object.keys(dateWhere).length ? { enrolled: dateWhere } : {}) } }),
      prisma.feedback.findMany({ where: { projectId: { in: scopedProjectIds }, ...(Object.keys(dateWhere).length ? { createdAt: dateWhere } : {}) } }),
    ]);
    const totalTarget = projects.reduce((a, p) => a + p.indicators.reduce((x, i) => x + i.target, 0), 0);
    const totalActual = projects.reduce((a, p) => a + p.indicators.reduce((x, i) => x + i.actual, 0), 0);
    const overallPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

    body = (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Overall achievement", value: `${overallPct}%` },
            { label: "Projects in scope", value: projects.length },
            { label: "Beneficiaries", value: beneficiaryCount },
            { label: "Feedback items", value: feedbackList.length },
          ].map((c) => (
            <div key={c.label} style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#665f52", marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</div>
            </div>
          ))}
        </div>
        {projects.map((p) => (
          <div key={p.id} style={cardStyle}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: "#665f52", marginBottom: 8 }}>{SECTOR_LABELS[p.sector] || p.sector} · {p.district}</div>
            {p.indicators.map((i) => {
              const pct = i.target > 0 ? Math.round((i.actual / i.target) * 100) : 0;
              const fPath = buildFrameworkPath(p.frameworkNodes, i.frameworkNodeId);
              return (
                <div key={i.id} style={{ fontSize: 12.5, marginBottom: 5 }}>
                  {fPath && <div style={{ fontSize: 10, color: "#8C6414" }}>{fPath}</div>}
                  <div>{i.name}: {i.actual}/{i.target} {i.unit} ({pct}%)</div>
                </div>
              );
            })}
          </div>
        ))}
      </>
    );
  }

  return (
    <main style={{ margin: "0", padding: "40px 32px", width: "100%", maxWidth: 900, boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <Link href={`/reports/${rr.reportType}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#1B3A5C", textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={13} /> Back to report queue
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <img src="/pwc-logo.png" alt="PWC logo" style={{ width: 36, height: 36, objectFit: "contain" }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{report?.name || rr.name}</div>
          <div style={{ fontSize: 12, color: "#665f52" }}>Pastoral Women's Council · Cloud-Based M&E Platform</div>
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: "#665f52", marginBottom: 20 }}>
        Period: {periodLabel} · Scope: {scopeLabel}
      </div>

      {body}

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Link href={`/api/reports/excel?requestId=${rr.id}`} style={{ background: "#5C7A3D", color: "#fff", textDecoration: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600 }}>Download Excel</Link>
        <Link href={`/api/reports/pdf?requestId=${rr.id}`} style={{ background: "#B8442D", color: "#fff", textDecoration: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600 }}>Download PDF</Link>
      </div>
    </main>
  );
}
