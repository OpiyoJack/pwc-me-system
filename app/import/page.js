import { prisma } from "../../lib/prisma";
import { auth } from "../../auth";
import { redirect } from "next/navigation";
import ImportCard from "./ImportCard";
import KoboImportCard from "./KoboImportCard";
import { hasPermission } from "../../lib/permissions";

export default async function ImportPage() {
  const session = await auth();
  const canImport = session?.user?.role === "admin"
    || session?.user?.role === "coordinator"
    || session?.user?.role === "meofficer"
    || hasPermission(session?.user, "can_import_data");
  if (session?.user?.role === "donor" || !canImport) {
    redirect("/");
  }

  const projects = await prisma.project.findMany({ orderBy: { name: "asc" } });

  const cards = [
    { key: "beneficiaries", icon: "👥", color: "#2E7D8C" },
    { key: "projects_indicators", icon: "📁", color: "#1B3A5C" },
    { key: "indicator_updates", icon: "📈", color: "#D9A441" },
    { key: "risks", icon: "⚠️", color: "#B8442D" },
    { key: "feedback", icon: "💬", color: "#5C7A3D" },
  ];

  return (
    <main style={{ margin: "0", padding: "40px 32px", maxWidth: 1300, boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Import Data</h1>
      <p style={{ color: "#665f52", fontSize: 13.5, marginBottom: 24, maxWidth: 750 }}>
        Download a branded template for the data you want to bring in, fill it out (or export from MS Excel,
        KOBO Collect, Google Sheets, SurveyMonkey, or Google/MS Forms into Excel/CSV first), then upload it below.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
        {cards.map((c) => (
          <ImportCard key={c.key} targetKey={c.key} icon={c.icon} accentColor={c.color} projects={projects} />
        ))}
        <KoboImportCard projects={projects} />
      </div>
    </main>
  );
}
