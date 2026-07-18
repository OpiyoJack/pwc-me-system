"use client";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  PieChart, Pie, LineChart, Line, AreaChart, Area,
} from "recharts";

const COLORS = ["#1B3A5C", "#B8442D", "#D9A441", "#5C7A3D", "#2E7D8C", "#8C4A6B"];
const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #DED2BC", background: "#FBF8F2" };

export function SectorRadar({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#DED2BC" />
        <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "#241D18" }} />
        <PolarRadiusAxis tick={{ fontSize: 10, fill: "#665f52" }} domain={[0, 100]} />
        <Radar name="% achieved" dataKey="pct" stroke="#1B3A5C" fill="#1B3A5C" fillOpacity={0.35} />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function DonutBreakdown({ data, colors }) {
  const palette = colors || COLORS;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
          {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 11.5 }} />
        <Tooltip contentStyle={tooltipStyle} />
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
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="beneficiaries" fill="#2E7D8C" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonorBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid stroke="#DED2BC" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#241D18" }} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 10.5, fill: "#241D18" }} axisLine={false} tickLine={false} width={140} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="projects" fill="#D9A441" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function IndicatorRankingBar({ data }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid stroke="#DED2BC" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#241D18" }} axisLine={false} tickLine={false} unit="%" />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 10.5, fill: "#241D18" }} axisLine={false} tickLine={false} width={180} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
        <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pct >= 80 ? "#5C7A3D" : d.pct >= 40 ? "#D9A441" : "#B8442D"} />
          ))}
        </Bar>
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
      <AreaChart data={data}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1B3A5C" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#1B3A5C" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#DED2BC" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 10.5, fill: "#241D18" }} axisLine={{ stroke: "#DED2BC" }} tickLine={false} />
        <YAxis tick={{ fontSize: 10.5, fill: "#241D18" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="updates" stroke="#1B3A5C" strokeWidth={2} fill="url(#trendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
