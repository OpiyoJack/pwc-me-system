"use client";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const COLORS = ["#1B3A5C", "#B8442D", "#D9A441", "#5C7A3D", "#2E7D8C", "#8C4A6B"];

export function SectorRadar({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#DED2BC" />
        <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "#241D18" }} />
        <PolarRadiusAxis tick={{ fontSize: 10, fill: "#665f52" }} domain={[0, 100]} />
        <Radar name="% achieved" dataKey="pct" stroke="#1B3A5C" fill="#1B3A5C" fillOpacity={0.35} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DED2BC" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function RiskBreakdown({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 11.5 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DED2BC" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DistrictComparisonBars({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid stroke="#DED2BC" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#241D18" }} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#241D18" }} axisLine={false} tickLine={false} width={90} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DED2BC" }} />
        <Bar dataKey="beneficiaries" fill="#2E7D8C" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function IndicatorTrend({ data }) {
  if (data.length === 0) {
    return <div style={{ padding: 30, textAlign: "center", color: "#665f52", fontSize: 13 }}>No progress updates recorded yet.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid stroke="#DED2BC" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10.5, fill: "#241D18" }} axisLine={{ stroke: "#DED2BC" }} tickLine={false} />
        <YAxis tick={{ fontSize: 10.5, fill: "#241D18" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DED2BC" }} />
        <Line type="monotone" dataKey="updates" stroke="#B8442D" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
