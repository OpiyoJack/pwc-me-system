import { prisma } from "../lib/prisma";

import Link from "next/link";
import { getEffectiveStatus } from "../lib/project-status";
import {
  FolderKanban, Users, UserCheck, MessageSquareWarning, Target,
  UserPlus, FilePlus2, UserCog, FileBarChart, AlertTriangle,
  TrendingUp, TrendingDown, ShieldAlert, CircleCheck,
} from "lucide-react";

const SECTORS = [
  { id: "education", label: "Education" },
  { id: "economic", label: "Economic" },
  { id: "rights", label: "Rights" },
  { id: "health", label: "Health" },
  { id: "water", label: "Water" },
  { id: "climate", label: "Climate" },
];
const SECTOR_LABELS = {
  education: "Education", economic: "Women's Economic Empowerment", rights: "Rights & Leadership",
  health: "Health", water: "Water", climate: "Climate Change",
};
const DISTRICTS = ["Ngorongoro", "Longido", "Monduli"];
const LEVEL_COLOR = { Low: { bg: "#E4EBD9", fg: "#5C7A3D" }, Medium: { bg: "#F6E7CC", fg: "#8C6414" }, High: { bg: "#F3DCD4", fg: "#B8442D" } };

export default async function DashboardPage() {
  const [projects, beneficiaries, members, feedback, risks] = await Promise.all([
    prisma.project.findMany({ include: { indicators: true }, orderBy: { id: "desc" } }),
    prisma.beneficiary.findMany(),
    prisma.member.findMany(),
    prisma.feedback.findMany({ orderBy: { id: "desc" }, include: { project: true } }),
    prisma.risk.findMany({ orderBy: { id: "desc" }, include: { project: true } }),
  ]);

  const activeMembers = members.filter((m) => m.status === "Active").length;
  const openFeedback = feedback.filter((f) => f.status === "Open").length;
  const totalIndicators = projects.reduce((a, p) => a + p.indicators.length, 0);
  const onTrack = projects.reduce((a, p) => a + p.indicators.filter((i) => i.actual / i.target >= 0.8).length, 0);
  const openRisks = risks.filter((r) => r.status !== "Closed").length;
  const highRisks = risks.filter((r) => r.status !== "Closed" && (r.likelihood === "High" || r.impact === "High")).length;

  const overviewCards = [
    { label: "Total projects", value: projects.length, href: "/projects", color: "#1B3A5C", Icon: FolderKanban },
    { label: "Beneficiaries reached", value: beneficiaries.length, href: "/beneficiaries", color: "#2E7D8C", Icon: Users },
    { label: "Active members", value: activeMembers, href: "/membership", color: "#5C7A3D", Icon: UserCheck },
    { label: "Open risks", value: openRisks, href: "/risks", color: "#B8442D", Icon: AlertTriangle },
    { label: "Open feedback", value: openFeedback, href: "/feedback", color: "#D9A441", Icon: MessageSquareWarning },
    { label: "Indicators on track", value: `${onTrack}/${totalIndicators}`, href: "/projects", color: "#8C4A6B", Icon: Target },
  ];

  const quickActions = [
    { label: "Add project", href: "/projects", Icon: FolderKanban },
    { label: "Add beneficiary", href: "/beneficiaries", Icon: UserPlus },
    { label: "Log risk", href: "/risks", Icon: AlertTriangle },
    { label: "Log feedback", href: "/feedback", Icon: FilePlus2 },
    { label: "Register member", href: "/membership", Icon: UserCog },
    { label: "View reports", href: "/reports", Icon: FileBarChart },
  ];

  const totalTarget = projects.reduce((a, p) => a + p.indicators.reduce((x, i) => x + i.target, 0), 0);
  const totalActual = projects.reduce((a, p) => a + p.indicators.reduce((x, i) => x + i.actual, 0), 0);
  const overallPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
  const sectorPerf = SECTORS.map((s) => {
    const sp = projects.filter((p) => p.sector === s.id);
    const t = sp.reduce((a, p) => a + p.indicators.reduce((x, i) => x + i.target, 0), 0);
    const ac = sp.reduce((a, p) => a + p.indicators.reduce((x, i) => x + i.actual, 0), 0);
    return { name: s.label, pct: t > 0 ? Math.round((ac / t) * 100) : null };
  }).filter((s) => s.pct !== null);
  const bestSector = sectorPerf.length ? sectorPerf.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  const worstSector = sectorPerf.length ? sectorPerf.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;
  const ongoingCount = projects.filter((p) => getEffectiveStatus(p) === "Ongoing").length;
  const completedCount = projects.filter((p) => getEffectiveStatus(p) === "Completed").length;
  const districtCount = new Set(projects.map((p) => p.district)).size;

  const recentProjects = projects.slice(0, 5);
  const recentFeedback = feedback.slice(0, 4);
  const priorityRisks = risks.filter((r) => r.status !== "Closed").slice(0, 4);

  const cardBase = { background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, textDecoration: "none", color: "#241D18" };

  return (
    <main style={{ margin: "0", padding: "40px 32px", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Dashboard Overview</h1>
      <p style={{ color: "#665f52", fontSize: 13.5, marginBottom: 24 }}>
        Live figures across Ngorongoro, Longido and Monduli.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 26 }}>
        {overviewCards.map((c) => (
          <Link key={c.label} href={c.href} style={{ ...cardBase, padding: "15px 16px", borderTop: `3px solid ${c.color}`, display: "block" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
              <c.Icon size={14} color={c.color} />
              <div style={{ fontSize: 11, color: "#665f52", textTransform: "uppercase", letterSpacing: "0.03em" }}>{c.label}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{c.value}</div>
          </Link>
        ))}
      </div>

      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
        Quick actions
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        {quickActions.map((a) => (
          <Link key={a.label} href={a.href} style={{ ...cardBase, padding: "14px 10px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <a.Icon size={20} color="#1B3A5C" />
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{a.label}</span>
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }} className="dash-split">
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Recent projects
            </div>
            <Link href="/projects" style={{ fontSize: 12.5, color: "#1B3A5C", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, marginBottom: 28, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
              <thead>
                <tr>
                  {["Project", "Sector", "District", "Progress"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, textTransform: "uppercase", color: "#665f52", borderBottom: "1px solid #DED2BC" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentProjects.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 20, textAlign: "center", color: "#665f52", fontSize: 13 }}>No projects yet.</td></tr>
                )}
                {recentProjects.map((p) => {
                  const t = p.indicators.reduce((a, i) => a + i.target, 0);
                  const ac = p.indicators.reduce((a, i) => a + i.actual, 0);
                  const pct = t > 0 ? Math.round((ac / t) * 100) : null;
                  return (
                    <tr key={p.id}>
                      <td style={{ padding: "10px 14px", fontSize: 13.5, fontWeight: 600, borderBottom: "1px solid #EDE6D8" }}>{p.name}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, borderBottom: "1px solid #EDE6D8" }}>{SECTOR_LABELS[p.sector] || p.sector}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, borderBottom: "1px solid #EDE6D8" }}>{p.district}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, borderBottom: "1px solid #EDE6D8", fontWeight: 700, color: pct === null ? "#999" : pct >= 80 ? "#5C7A3D" : pct >= 40 ? "#8C6414" : "#B8442D" }}>
                        {pct !== null ? `${pct}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Recent feedback
            </div>
            <Link href="/feedback" style={{ fontSize: 12.5, color: "#1B3A5C", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {recentFeedback.length === 0 && (
              <div style={{ ...cardBase, padding: 16, textAlign: "center", color: "#665f52", fontSize: 13 }}>No feedback logged yet.</div>
            )}
            {recentFeedback.map((f) => {
              const tone = f.category === "Complaint" ? { bg: "#F3DCD4", fg: "#B8442D" } : f.category === "Suggestion" ? { bg: "#F6E7CC", fg: "#8C6414" } : { bg: "#E4EBD9", fg: "#5C7A3D" };
              return (
                <div key={f.id} style={{ ...cardBase, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 13, flex: 1, minWidth: 200 }}>{f.note}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: "#665f52" }}>{f.district}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: tone.bg, color: tone.fg }}>{f.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Priority risks
            </div>
            <Link href="/risks" style={{ fontSize: 12.5, color: "#1B3A5C", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "grid", gap: 8, marginBottom: 28 }}>
            {priorityRisks.length === 0 && (
              <div style={{ ...cardBase, padding: 16, textAlign: "center", color: "#665f52", fontSize: 13 }}>No open risks. 🎉</div>
            )}
            {priorityRisks.map((r) => (
              <div key={r.id} style={{ ...cardBase, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.title}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: r.project ? 5 : 0 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: LEVEL_COLOR[r.likelihood].bg, color: LEVEL_COLOR[r.likelihood].fg }}>
                    Likelihood: {r.likelihood}
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: LEVEL_COLOR[r.impact].bg, color: LEVEL_COLOR[r.impact].fg }}>
                    Impact: {r.impact}
                  </span>
                </div>
                {r.project && <div style={{ fontSize: 11, color: "#665f52" }}>{r.project.name}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
        Programme summary
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderTop: "3px solid #1B3A5C", borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Target size={15} color="#1B3A5C" />
            <span style={{ fontSize: 11, color: "#665f52", textTransform: "uppercase" }}>Overall achievement</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{overallPct}%</div>
          <div style={{ fontSize: 12, color: "#665f52" }}>Across {projects.length} project{projects.length !== 1 ? "s" : ""} in {districtCount} district{districtCount !== 1 ? "s" : ""}</div>
        </div>

        <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderTop: "3px solid #5C7A3D", borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <CircleCheck size={15} color="#5C7A3D" />
            <span style={{ fontSize: 11, color: "#665f52", textTransform: "uppercase" }}>Project status</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{ongoingCount} ongoing</div>
          <div style={{ fontSize: 12, color: "#665f52" }}>{completedCount} completed so far</div>
        </div>

        {bestSector && (
          <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderTop: "3px solid #5C7A3D", borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <TrendingUp size={15} color="#5C7A3D" />
              <span style={{ fontSize: 11, color: "#665f52", textTransform: "uppercase" }}>Strongest sector</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{bestSector.name}</div>
            <div style={{ fontSize: 12, color: "#665f52" }}>{bestSector.pct}% of target reached</div>
          </div>
        )}

        {worstSector && worstSector.name !== bestSector?.name && (
          <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderTop: "3px solid #B8442D", borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <TrendingDown size={15} color="#B8442D" />
              <span style={{ fontSize: 11, color: "#665f52", textTransform: "uppercase" }}>Needs attention</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{worstSector.name}</div>
            <div style={{ fontSize: 12, color: "#665f52" }}>Only {worstSector.pct}% of target reached</div>
          </div>
        )}

        <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderTop: "3px solid #8C6414", borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <ShieldAlert size={15} color="#8C6414" />
            <span style={{ fontSize: 11, color: "#665f52", textTransform: "uppercase" }}>Risk & feedback</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{openRisks} open risks</div>
          <div style={{ fontSize: 12, color: "#665f52" }}>{highRisks} high priority · {openFeedback} feedback pending</div>
        </div>
      </div>
      <a href="/analytics" style={{ fontSize: 12.5, color: "#1B3A5C", fontWeight: 600, textDecoration: "none" }}>See full charts and analytics →</a>
    </main>
  );
}
