import { prisma } from "../../../lib/prisma";
import { auth } from "../../../auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowLeft } from "lucide-react";
import DeleteProjectButton from "../DeleteProjectButton";
import FrameworkTree from "../framework/FrameworkTree";
import { getEffectiveStatus } from "../../../lib/project-status";

const SECTOR_LABELS = {
  education: "Education", economic: "Women's Economic Empowerment", rights: "Rights & Leadership",
  health: "Health", water: "Water", climate: "Climate Change",
};
const STATUS_COLOR = {
  Planned: { bg: "#DDE6EE", fg: "#2E7D8C" },
  Ongoing: { bg: "#E4EBD9", fg: "#5C7A3D" },
  Completed: { bg: "#E4E1F0", fg: "#5B4B8A" },
  "On Hold": { bg: "#F6E7CC", fg: "#8C6414" },
  Terminated: { bg: "#F3DCD4", fg: "#B8442D" },
};
const LEVEL_COLOR = { Low: { bg: "#E4EBD9", fg: "#5C7A3D" }, Medium: { bg: "#F6E7CC", fg: "#8C6414" }, High: { bg: "#F3DCD4", fg: "#B8442D" } };

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;
  const projectId = Number(id);
  if (!projectId) notFound();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      indicators: true,
      coordinator: true,
      donorContact: true,
      risks: { orderBy: { id: "desc" } },
      feedbacks: { orderBy: { id: "desc" } },
      beneficiaries: { orderBy: { id: "desc" } },
      frameworkNodes: { orderBy: { order: "asc" } },
    },
  });
  if (!project) notFound();

  const session = await auth();
  const canEdit = session?.user?.role !== "donor";
  const isAdmin = session?.user?.role === "admin";
  const canDelete = isAdmin || require("../../../lib/permissions").hasPermission(session?.user, "can_delete_projects");

  const totalTarget = project.indicators.reduce((a, i) => a + i.target, 0);
  const totalActual = project.indicators.reduce((a, i) => a + i.actual, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : null;
  const effectiveStatus = getEffectiveStatus(project);
  const statusColor = STATUS_COLOR[effectiveStatus] || STATUS_COLOR.Ongoing;

  const cardStyle = { background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 20 };

  return (
    <main style={{ margin: "0", padding: "40px 32px", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <Link href="/projects" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#1B3A5C", textDecoration: "none" }}>
          <ArrowLeft size={13} /> Back to all projects
        </Link>
        {canDelete && <DeleteProjectButton projectId={project.id} projectName={project.name} redirectAfter="/projects" />}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 6 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{project.name}</h1>
        {overallPct !== null && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: overallPct >= 80 ? "#5C7A3D" : overallPct >= 40 ? "#8C6414" : "#B8442D" }}>{overallPct}%</div>
            <div style={{ fontSize: 10.5, color: "#665f52", textTransform: "uppercase" }}>overall achievement</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 24 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: statusColor.bg, color: statusColor.fg }}>{effectiveStatus}</span>
        <span style={{ fontSize: 12.5, color: "#665f52" }}>{SECTOR_LABELS[project.sector] || project.sector}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12.5, color: "#665f52" }}><MapPin size={12} /> {project.district}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 10.5, color: "#665f52", textTransform: "uppercase", marginBottom: 6 }}>Coordinator</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{project.coordinator ? project.coordinator.name : "Unassigned"}</div>
          {project.coordinator && <div style={{ fontSize: 11.5, color: "#665f52" }}>{project.coordinator.email}</div>}
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 10.5, color: "#665f52", textTransform: "uppercase", marginBottom: 6 }}>Donor contact</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{project.donorContact ? project.donorContact.name : "Unassigned"}</div>
          {project.donorContact && <div style={{ fontSize: 11.5, color: "#665f52" }}>{project.donorContact.email}</div>}
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 10.5, color: "#665f52", textTransform: "uppercase", marginBottom: 6 }}>Budget</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{project.budget ? `TSh ${project.budget.toLocaleString()}` : "Not set"}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 10.5, color: "#665f52", textTransform: "uppercase", marginBottom: 6 }}>Start date</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : "Not set"}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 10.5, color: "#665f52", textTransform: "uppercase", marginBottom: 6 }}>Expected end date</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : "Not set"}</div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Results Framework</div>
        <div style={{ fontSize: 12, color: "#665f52", marginBottom: 14 }}>
          Build any number of levels (Goal, Outcome, Output, or your own labels) and attach indicators wherever they belong.
        </div>
        <FrameworkTree nodes={project.frameworkNodes} indicators={project.indicators} projectId={project.id} canEdit={canEdit} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="detail-split">
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Beneficiaries ({project.beneficiaries.length})</div>
          {project.beneficiaries.length === 0 && <div style={{ fontSize: 13, color: "#665f52" }}>None linked yet.</div>}
          <div style={{ display: "grid", gap: 6, maxHeight: 260, overflowY: "auto" }}>
            {project.beneficiaries.slice(0, 20).map((b) => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, background: "#F3EDE0", borderRadius: 7, padding: "6px 10px" }}>
                <span>{b.name}</span>
                <span style={{ color: "#665f52" }}>{b.sex}, {b.age}</span>
              </div>
            ))}
          </div>
          {project.beneficiaries.length > 20 && (
            <Link href={`/beneficiaries?q=${encodeURIComponent(project.name)}`} style={{ fontSize: 12, color: "#1B3A5C", marginTop: 8, display: "inline-block" }}>View all →</Link>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Risks ({project.risks.filter((r) => r.status !== "Closed").length} open)</div>
          {project.risks.length === 0 && <div style={{ fontSize: 13, color: "#665f52" }}>No risks logged.</div>}
          <div style={{ display: "grid", gap: 8 }}>
            {project.risks.map((r) => (
              <div key={r.id} style={{ background: "#F3EDE0", borderRadius: 7, padding: "8px 10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ opacity: r.status === "Closed" ? 0.5 : 1, textDecoration: r.status === "Closed" ? "line-through" : "none" }}>{r.title}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: LEVEL_COLOR[r.impact].bg, color: LEVEL_COLOR[r.impact].fg }}>{r.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Feedback & complaints ({project.feedbacks.length})</div>
        {project.feedbacks.length === 0 && <div style={{ fontSize: 13, color: "#665f52" }}>None logged for this project.</div>}
        <div style={{ display: "grid", gap: 8 }}>
          {project.feedbacks.map((f) => {
            const tone = f.category === "Complaint" ? { bg: "#F3DCD4", fg: "#B8442D" } : f.category === "Suggestion" ? { bg: "#F6E7CC", fg: "#8C6414" } : { bg: "#E4EBD9", fg: "#5C7A3D" };
            return (
              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "#F3EDE0", borderRadius: 7, padding: "8px 12px", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5 }}>{f.note}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: tone.bg, color: tone.fg, whiteSpace: "nowrap" }}>{f.category} · {f.status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
