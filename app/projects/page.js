import { prisma } from "../../lib/prisma";
import { auth } from "../../auth";
import NewProjectForm from "./NewProjectForm";
import IndicatorProgress from "./IndicatorProgress";
import AssignmentPicker from "./AssignmentPicker";
import DeleteProjectButton from "./DeleteProjectButton";
import { getEffectiveStatus } from "../../lib/project-status";
import Link from "next/link";
import { GraduationCap, Coins, Scale, HeartPulse, Droplet, CloudRain, MapPin, FolderKanban } from "lucide-react";

const SECTOR_STYLE = {
  education: { label: "Education", color: "#1B3A5C", Icon: GraduationCap },
  economic:  { label: "Women's Economic Empowerment", color: "#D9A441", Icon: Coins },
  rights:    { label: "Rights & Leadership", color: "#B8442D", Icon: Scale },
  health:    { label: "Health", color: "#8C4A6B", Icon: HeartPulse },
  water:     { label: "Water", color: "#2E7D8C", Icon: Droplet },
  climate:   { label: "Climate Change", color: "#5C7A3D", Icon: CloudRain },
};

export default async function ProjectsPage({ searchParams }) {
  const session = await auth();
  const canEdit = session?.user?.role !== "donor";
  const isAdmin = session?.user?.role === "admin";
  const canDelete = isAdmin || require("../../lib/permissions").hasPermission(session?.user, "can_delete_projects");
  const params = await searchParams;
  const activeSector = params?.sector || "all";

  const [allProjects, coordinators, donors] = await Promise.all([
    prisma.project.findMany({
      include: { indicators: { include: { formula: true } }, risks: true, coordinator: true, donorContact: true },
      orderBy: { id: "asc" },
    }),
    prisma.user.findMany({ where: { role: { in: ["coordinator", "meofficer", "admin"] } }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "donor" }, orderBy: { name: "asc" } }),
  ]);
  const districts = [...new Set(allProjects.map((p) => p.district))].sort();
  const projects = activeSector === "all" ? allProjects : allProjects.filter((p) => p.sector === activeSector);

  const tabs = [
    { id: "all", label: "All sectors", count: allProjects.length },
    ...Object.entries(SECTOR_STYLE).map(([id, s]) => ({
      id, label: s.label, count: allProjects.filter((p) => p.sector === id).length,
    })),
  ];

  return (
    <main style={{ margin: "0", padding: "40px 32px", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ background: "#1B3A5C22", color: "#1B3A5C", borderRadius: 10, padding: 9, display: "flex" }}>
          <FolderKanban size={20} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Projects & Indicators</h1>
      </div>
      <p style={{ color: "#665f52", fontSize: 13.5, marginBottom: 22, marginLeft: 48 }}>
        {allProjects.length} active project{allProjects.length !== 1 ? "s" : ""} across {districts.length} district{districts.length !== 1 ? "s" : ""}
      </p>

      {canEdit && <NewProjectForm districts={districts} coordinators={coordinators} donors={donors} />}

      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {tabs.map((t) => {
          const active = t.id === activeSector;
          const linkHref = t.id === "all" ? "/projects" : "/projects?sector=" + t.id;
          return (
            <Link
              key={t.id}
              href={linkHref}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                padding: "7px 13px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                textDecoration: "none",
                background: active ? "#1B3A5C" : "#FBF8F2",
                color: active ? "#fff" : "#241D18",
                border: "1px solid " + (active ? "#1B3A5C" : "#DED2BC"),
              }}
            >
              {t.label}
              <span style={{
                background: active ? "rgba(255,255,255,0.25)" : "#EDE6D8", borderRadius: 10,
                fontSize: 11, padding: "1px 6px", fontWeight: 700,
              }}>{t.count}</span>
            </Link>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div style={{ background: "#FBF8F2", border: "1px dashed #DED2BC", borderRadius: 10, padding: 30, textAlign: "center", color: "#665f52", fontSize: 13.5 }}>
          No projects in this sector yet.
        </div>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {projects.map((p) => {
          const s = SECTOR_STYLE[p.sector] || { label: p.sector, color: "#1B3A5C", Icon: FolderKanban };
          const SectorIcon = s.Icon;
          const totalTarget = p.indicators.reduce((a, i) => a + i.target, 0);
          const totalActual = p.indicators.reduce((a, i) => a + i.actual, 0);
          const overallPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : null;

          return (
            <div key={p.id} style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(36,29,24,0.05)" }}>
              <div style={{ height: 5, background: s.color }} />
              <div style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ background: s.color + "1c", color: s.color, borderRadius: 9, padding: 9, display: "flex", flexShrink: 0 }}>
                      <SectorIcon size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 16.5, fontWeight: 700, margin: 0, marginBottom: 3 }}>
                        <Link href={`/projects/${p.id}`} style={{ color: "#241D18", textDecoration: "none" }}>{p.name} →</Link>
                      </h2>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: s.color + "1c", color: s.color }}>
                          {s.label}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "#665f52" }}>
                          <MapPin size={12} /> {p.district}
                        </span>
                      </div>
                    </div>
                  </div>
                  {overallPct !== null && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: overallPct >= 80 ? "#5C7A3D" : overallPct >= 40 ? "#8C6414" : "#B8442D" }}>
                        {overallPct}%
                      </div>
                      <div style={{ fontSize: 10.5, color: "#665f52", textTransform: "uppercase", letterSpacing: "0.04em" }}>overall</div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <AssignmentPicker project={p} coordinators={coordinators} donors={donors} canEdit={canEdit} effectiveStatus={getEffectiveStatus(p)} />
                  {canDelete && <DeleteProjectButton projectId={p.id} projectName={p.name} />}
                </div>

                {p.indicators.length === 0 && (
                  <p style={{ fontSize: 12.5, opacity: 0.5, marginLeft: 4 }}>No indicators added yet.</p>
                )}
                <div style={{ display: "grid", gap: 4 }}>
                  {p.indicators.map((i) => (
                    <IndicatorProgress key={i.id} indicator={i} canEdit={canEdit} projectId={p.id} />
                  ))}
                </div>

                {p.risks.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #EDE6D8" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#665f52", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 8 }}>
                      Risks ({p.risks.filter((r) => r.status !== "Closed").length} open)
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {p.risks.map((r) => {
                        const lvl = { Low: "#5C7A3D", Medium: "#8C6414", High: "#B8442D" };
                        return (
                          <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 12.5, background: "#F3EDE0", borderRadius: 7, padding: "7px 10px" }}>
                            <span style={{ opacity: r.status === "Closed" ? 0.5 : 1, textDecoration: r.status === "Closed" ? "line-through" : "none" }}>{r.title}</span>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: lvl[r.impact], whiteSpace: "nowrap" }}>{r.status === "Closed" ? "Closed" : `${r.impact} impact`}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
