import { prisma } from "../../lib/prisma";
import StatCards from "../components/StatCards";
import { SectorRadar, RiskBreakdown, DistrictComparisonBars, IndicatorTrend } from "./charts";
import { getEffectiveStatus } from "../../lib/project-status";

export const dynamic = "force-dynamic";
import { Radar, ShieldAlert, MapPin, TrendingUp, BarChart3 } from "lucide-react";

const SECTOR_LABELS = {
  education: "Education", economic: "Economic", rights: "Rights",
  health: "Health", water: "Water", climate: "Climate",
};
const DISTRICTS = ["Ngorongoro", "Longido", "Monduli"];

function ChartCard({ icon: Icon, title, children }) {
  return (
    <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(36,29,24,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ background: "#1B3A5C1c", color: "#1B3A5C", borderRadius: 7, padding: 6, display: "flex" }}>
          <Icon size={14} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

export default async function AnalyticsPage() {
  const [projects, beneficiaries, risks, updates] = await Promise.all([
    prisma.project.findMany({ include: { indicators: true } }),
    prisma.beneficiary.findMany(),
    prisma.risk.findMany(),
    prisma.indicatorUpdate.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const sectorRadarData = Object.entries(SECTOR_LABELS).map(([id, label]) => {
    const sp = projects.filter((p) => p.sector === id);
    const t = sp.reduce((a, p) => a + p.indicators.reduce((x, i) => x + i.target, 0), 0);
    const ac = sp.reduce((a, p) => a + p.indicators.reduce((x, i) => x + i.actual, 0), 0);
    return { name: label, pct: t > 0 ? Math.round((ac / t) * 100) : 0 };
  });

  const riskData = [
    { name: "Open", value: risks.filter((r) => r.status === "Open").length },
    { name: "Mitigated", value: risks.filter((r) => r.status === "Mitigated").length },
    { name: "Closed", value: risks.filter((r) => r.status === "Closed").length },
  ].filter((r) => r.value > 0);

  const STATUS_LIST = ["Planned", "Ongoing", "Completed", "On Hold", "Terminated"];
  const statusData = STATUS_LIST.map((s) => ({ name: s, value: projects.filter((p) => getEffectiveStatus(p) === s).length })).filter((s) => s.value > 0);

  const districtBarData = DISTRICTS.map((d) => ({
    name: d,
    beneficiaries: beneficiaries.filter((b) => b.district === d).length,
  }));

  const updatesByDay = {};
  updates.forEach((u) => {
    const day = u.createdAt.toISOString().slice(0, 10);
    updatesByDay[day] = (updatesByDay[day] || 0) + 1;
  });
  const trendData = Object.entries(updatesByDay).map(([date, updates]) => ({ date, updates }));

  const totalTarget = projects.reduce((a, p) => a + p.indicators.reduce((x, i) => x + i.target, 0), 0);
  const totalActual = projects.reduce((a, p) => a + p.indicators.reduce((x, i) => x + i.actual, 0), 0);
  const overallPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
  const nonZeroSectors = sectorRadarData.filter((s) => s.pct > 0);
  const bestSector = nonZeroSectors.length ? nonZeroSectors.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  const worstSector = nonZeroSectors.length ? nonZeroSectors.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;

  return (
    <main style={{ margin: "0", padding: "40px 32px", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ background: "#1B3A5C22", color: "#1B3A5C", borderRadius: 10, padding: 9, display: "flex" }}>
          <BarChart3 size={20} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Analytics</h1>
      </div>
      <p style={{ color: "#665f52", fontSize: 13.5, marginBottom: 22, marginLeft: 48 }}>
        A deeper look at performance trends across sectors, districts, and risk status.
      </p>

      <StatCards
        cards={[
          { label: "Overall achievement", value: `${overallPct}%`, color: "#1B3A5C" },
          { label: "Strongest sector", value: bestSector?.name || "—", color: "#5C7A3D" },
          { label: "Needs attention", value: worstSector?.name || "—", color: "#B8442D" },
          { label: "Progress updates logged", value: updates.length, color: "#D9A441" },
        ]}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="analytics-grid">
        <ChartCard icon={Radar} title="Sector achievement">
          <SectorRadar data={sectorRadarData} />
        </ChartCard>

        <ChartCard icon={TrendingUp} title="Project status breakdown">
          {statusData.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "#665f52", fontSize: 13 }}>No projects yet.</div>
          ) : (
            <RiskBreakdown data={statusData} />
          )}
        </ChartCard>

        <ChartCard icon={ShieldAlert} title="Risk status breakdown">
          {riskData.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "#665f52", fontSize: 13 }}>No risks logged yet.</div>
          ) : (
            <RiskBreakdown data={riskData} />
          )}
        </ChartCard>

        <ChartCard icon={MapPin} title="Beneficiaries by district">
          <DistrictComparisonBars data={districtBarData} />
        </ChartCard>
      </div>

      <ChartCard icon={TrendingUp} title="Indicator updates over time">
        <IndicatorTrend data={trendData} />
      </ChartCard>

      <div style={{ background: "#F3EDE0", border: "1px dashed #DED2BC", borderRadius: 12, padding: 20, marginTop: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>AI-generated insights</div>
        <div style={{ fontSize: 13, color: "#665f52" }}>
          Coming next — once your Anthropic API key is added, this section will generate a written summary of what's happening across your projects.
        </div>
      </div>
    </main>
  );
}
