import { prisma } from "../../lib/prisma";
import StatCards from "../components/StatCards";
import {
  SectorRadar, DonutBreakdown, DistrictComparisonBars, DonorBarChart,
  IndicatorRankingBar, IndicatorTrend,
} from "./charts";
import { getEffectiveStatus } from "../../lib/project-status";
import { Radar, ShieldAlert, MapPin, TrendingUp, BarChart3, Users, HandCoins, Trophy, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { buildRegionPrevalence } from "../../lib/gis-helpers";
import ProjectMap from "../components/ProjectMap";

export const dynamic = "force-dynamic";

const SECTOR_LABELS = {
  education: "Education", economic: "Economic", rights: "Rights",
  health: "Health", water: "Water", climate: "Climate",
};
const DISTRICTS = ["Ngorongoro", "Longido", "Monduli"];
const SEX_COLORS = ["#B8442D", "#1B3A5C"];

function ChartCard({ icon: Icon, title, action, children }) {
  return (
    <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(36,29,24,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "#1B3A5C1c", color: "#1B3A5C", borderRadius: 7, padding: 6, display: "flex" }}>
            <Icon size={14} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", textTransform: "uppercase", letterSpacing: "0.05em", margin: "26px 0 12px" }}>
      {children}
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }) {
  const params = await searchParams;
  const sectorFilter = params?.sector || "all";
  const districtFilter = params?.district || "all";

  const [allProjects, allBeneficiaries, risks, updates] = await Promise.all([
    prisma.project.findMany({ include: { indicators: true, donorContact: true } }),
    prisma.beneficiary.findMany(),
    prisma.risk.findMany(),
    prisma.indicatorUpdate.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const projects = allProjects.filter((p) =>
    (sectorFilter === "all" || p.sector === sectorFilter) &&
    (districtFilter === "all" || p.district === districtFilter)
  );
  const projectIds = new Set(projects.map((p) => p.id));
  const beneficiaries = allBeneficiaries.filter((b) => !b.projectId || projectIds.has(b.projectId));

  const sectorRadarData = Object.entries(SECTOR_LABELS).map(([id, label]) => {
    const sp = projects.filter((p) => p.sector === id);
    const t = sp.reduce((a, p) => a + p.indicators.reduce((x, i) => x + i.target, 0), 0);
    const ac = sp.reduce((a, p) => a + p.indicators.reduce((x, i) => x + i.actual, 0), 0);
    return { name: label, pct: t > 0 ? Math.round((ac / t) * 100) : 0 };
  });

  const STATUS_LIST = ["Planned", "Ongoing", "Completed", "On Hold", "Terminated"];
  const statusData = STATUS_LIST.map((s) => ({ name: s, value: projects.filter((p) => getEffectiveStatus(p) === s).length })).filter((s) => s.value > 0);

  const projectRiskIds = new Set(projects.map((p) => p.id));
  const scopedRisks = risks.filter((r) => !r.projectId || projectRiskIds.has(r.projectId));
  const riskData = [
    { name: "Open", value: scopedRisks.filter((r) => r.status === "Open").length },
    { name: "Mitigated", value: scopedRisks.filter((r) => r.status === "Mitigated").length },
    { name: "Closed", value: scopedRisks.filter((r) => r.status === "Closed").length },
  ].filter((r) => r.value > 0);

  const districtBarData = DISTRICTS.map((d) => ({ name: d, beneficiaries: beneficiaries.filter((b) => b.district === d).length }));

  const sexData = ["Female", "Male"]
    .map((s) => ({ name: s, value: beneficiaries.filter((b) => b.sex === s).length }))
    .filter((s) => s.value > 0);

  const donorMap = {};
  projects.forEach((p) => {
    const key = p.donorContact ? p.donorContact.name : "Unassigned";
    donorMap[key] = (donorMap[key] || 0) + 1;
  });
  const donorData = Object.entries(donorMap).map(([name, projects]) => ({ name, projects })).sort((a, b) => b.projects - a.projects);

  const allIndicators = projects.flatMap((p) => p.indicators.map((i) => ({
    name: `${i.name} (${p.name.split(" ")[0]}…)`,
    pct: i.target > 0 ? Math.round((i.actual / i.target) * 100) : 0,
  })));
  const topIndicators = [...allIndicators].sort((a, b) => b.pct - a.pct).slice(0, 5);
  const bottomIndicators = [...allIndicators].sort((a, b) => a.pct - b.pct).slice(0, 5);

  const scopedUpdateIndicatorIds = new Set(projects.flatMap((p) => p.indicators.map((i) => i.id)));
  const scopedUpdates = updates.filter((u) => scopedUpdateIndicatorIds.has(u.indicatorId));
  const updatesByMonth = {};
  scopedUpdates.forEach((u) => {
    const month = u.createdAt.toISOString().slice(0, 7);
    updatesByMonth[month] = (updatesByMonth[month] || 0) + 1;
  });
  const trendData = Object.entries(updatesByMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, updates]) => ({ month, updates }));

  const regionPrevalence = buildRegionPrevalence(projects, beneficiaries);

  const totalTarget = projects.reduce((a, p) => a + p.indicators.reduce((x, i) => x + i.target, 0), 0);
  const totalActual = projects.reduce((a, p) => a + p.indicators.reduce((x, i) => x + i.actual, 0), 0);
  const overallPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
  const nonZeroSectors = sectorRadarData.filter((s) => s.pct > 0);
  const bestSector = nonZeroSectors.length ? nonZeroSectors.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  const worstSector = nonZeroSectors.length ? nonZeroSectors.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;

  const inputStyle = { padding: "8px 10px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13, boxSizing: "border-box" };

  return (
    <main style={{ margin: "0", padding: "40px 32px", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#1B3A5C22", color: "#1B3A5C", borderRadius: 10, padding: 9, display: "flex" }}>
            <BarChart3 size={20} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Analytics</h1>
        </div>
        <form method="GET" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select name="sector" defaultValue={sectorFilter} style={inputStyle}>
            <option value="all">All sectors</option>
            {Object.entries(SECTOR_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <select name="district" defaultValue={districtFilter} style={inputStyle}>
            <option value="all">All districts</option>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <button type="submit" style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Apply</button>
          {(sectorFilter !== "all" || districtFilter !== "all") && (
            <Link href="/analytics" style={{ display: "flex", alignItems: "center", fontSize: 12.5, color: "#665f52" }}>Clear</Link>
          )}
        </form>
      </div>
      <p style={{ color: "#665f52", fontSize: 13.5, marginBottom: 22, marginLeft: 48 }}>
        A deeper look at performance trends across sectors, districts, and risk status.
      </p>

      <StatCards
        cards={[
          { label: "Overall achievement", value: `${overallPct}%`, color: "#1B3A5C" },
          { label: "Strongest sector", value: bestSector?.name || "—", color: "#5C7A3D" },
          { label: "Needs attention", value: worstSector?.name || "—", color: "#B8442D" },
          { label: "Progress updates logged", value: scopedUpdates.length, color: "#D9A441" },
        ]}
      />

      <SectionLabel>Geographic Prevalence</SectionLabel>
      <ChartCard icon={MapPin} title="Projects & beneficiaries by region">
        <ProjectMap regions={regionPrevalence} height={380} />
        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11.5, color: "#665f52" }}>
          <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: "#1B3A5C", marginRight: 5 }} />Has active project(s)</span>
          <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: "#D9A441", marginRight: 5 }} />Beneficiaries only</span>
        </div>
      </ChartCard>

      <SectionLabel>Programme Performance</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="analytics-grid">
        <ChartCard icon={Radar} title="Sector achievement">
          <SectorRadar data={sectorRadarData} />
        </ChartCard>
        <ChartCard icon={TrendingUp} title="Project status breakdown">
          {statusData.length === 0 ? <EmptyNote /> : <DonutBreakdown data={statusData} />}
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }} className="analytics-grid">
        <ChartCard icon={Trophy} title="Top 5 indicators by achievement">
          {topIndicators.length === 0 ? <EmptyNote text="No indicators in scope." /> : <IndicatorRankingBar data={topIndicators} />}
        </ChartCard>
        <ChartCard icon={AlertTriangle} title="Indicators needing attention">
          {bottomIndicators.length === 0 ? <EmptyNote text="No indicators in scope." /> : <IndicatorRankingBar data={bottomIndicators} />}
        </ChartCard>
      </div>

      <SectionLabel>Reach & Demographics</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="analytics-grid">
        <ChartCard icon={MapPin} title="Beneficiaries by district">
          <DistrictComparisonBars data={districtBarData} />
        </ChartCard>
        <ChartCard icon={Users} title="Beneficiaries by sex">
          {sexData.length === 0 ? <EmptyNote /> : <DonutBreakdown data={sexData} colors={SEX_COLORS} />}
        </ChartCard>
      </div>

      <SectionLabel>Governance & Funding</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="analytics-grid">
        <ChartCard icon={ShieldAlert} title="Risk status breakdown">
          {riskData.length === 0 ? <EmptyNote text="No risks logged yet." /> : <DonutBreakdown data={riskData} />}
        </ChartCard>
        <ChartCard icon={HandCoins} title="Projects by donor">
          {donorData.length === 0 ? <EmptyNote /> : <DonorBarChart data={donorData} />}
        </ChartCard>
      </div>

      <SectionLabel>Trends</SectionLabel>
      <ChartCard icon={TrendingUp} title="Indicator updates over time">
        <IndicatorTrend data={trendData} />
      </ChartCard>

      <div style={{ background: "#F3EDE0", border: "1px dashed #DED2BC", borderRadius: 12, padding: 20, marginTop: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>AI-generated insights</div>
        <div style={{ fontSize: 13, color: "#665f52" }}>
          Coming next — once an Anthropic API key is added, this section will generate a written summary of what's happening across your projects.
        </div>
      </div>
    </main>
  );
}

function EmptyNote({ text = "No data for this selection." }) {
  return <div style={{ padding: 30, textAlign: "center", color: "#665f52", fontSize: 13 }}>{text}</div>;
}
