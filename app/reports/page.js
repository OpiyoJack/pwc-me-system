import Link from "next/link";
import { REPORT_CATALOG, REPORT_CATEGORIES } from "../../lib/report-catalog";
import { FileBarChart } from "lucide-react";

export default async function ReportsCatalogPage({ searchParams }) {
  const params = await searchParams;
  const activeCategory = params?.category || REPORT_CATEGORIES[0];

  const reportsInCategory = REPORT_CATALOG.filter((r) => r.category === activeCategory);

  return (
    <main style={{ margin: "0", padding: "40px 32px", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Reports</h1>
      <p style={{ color: "#665f52", fontSize: 13.5, marginBottom: 22 }}>
        Choose a report below, then request it with a date range and scope. Excel or PDF is chosen once it's ready.
      </p>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", borderBottom: "1px solid #DED2BC", paddingBottom: 2 }}>
        {REPORT_CATEGORIES.map((cat) => {
          const active = cat === activeCategory;
          return (
            <Link
              key={cat}
              href={`/reports?category=${encodeURIComponent(cat)}`}
              style={{
                padding: "9px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none",
                color: active ? "#fff" : "#241D18",
                background: active ? "#1B3A5C" : "#FBF8F2",
                border: "1px solid " + (active ? "#1B3A5C" : "#DED2BC"),
                borderBottom: active ? "1px solid #1B3A5C" : "1px solid #DED2BC",
                borderRadius: "8px 8px 0 0",
              }}
            >
              {cat}
            </Link>
          );
        })}
      </div>

      <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, overflow: "hidden" }}>
        {reportsInCategory.map((r, i) => (
          <Link
            key={r.id}
            href={`/reports/${r.id}`}
            style={{
              display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 20px",
              textDecoration: "none", color: "#241D18",
              borderBottom: i < reportsInCategory.length - 1 ? "1px solid #EDE6D8" : "none",
            }}
          >
            <div style={{ background: "#1B3A5C22", color: "#1B3A5C", borderRadius: 8, padding: 8, display: "flex", flexShrink: 0 }}>
              <FileBarChart size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{r.name}</div>
              <div style={{ fontSize: 12.5, color: "#665f52" }}>{r.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
