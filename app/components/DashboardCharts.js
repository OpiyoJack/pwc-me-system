"use client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const PIE_COLORS = ["#B8442D", "#1B3A5C", "#D9A441"];

export default function DashboardCharts({ sectorData, districtData }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 28 }} className="chart-grid">
      <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Actual vs. target by sector</div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorData} margin={{ left: -18 }}>
              <CartesianGrid stroke="#DED2BC" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#241D18" }} axisLine={{ stroke: "#DED2BC" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#241D18" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DED2BC" }} />
              <Legend wrapperStyle={{ fontSize: 11.5 }} />
              <Bar dataKey="Target" fill="#DED2BC" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#1B3A5C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Beneficiaries by district</div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={districtData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {districtData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11.5 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DED2BC" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
