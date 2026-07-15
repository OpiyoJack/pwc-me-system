import { prisma } from "../../../lib/prisma";
import { auth } from "../../../auth";
import { resolveReportScope } from "../../../lib/report-scope";
import { getReportById } from "../../../lib/report-catalog";
import RequestReportModal from "../RequestReportModal";
import QueuePoller from "../QueuePoller";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import RefreshButton from "../RefreshButton";
import EncryptedDownloadButton from "../EncryptedDownloadButton";

function formatDateTime(d) {
  return new Date(d).toISOString().slice(0, 16).replace("T", " ");
}
function timeTaken(start, end) {
  if (!end) return "—";
  const secs = Math.max(0, Math.round((new Date(end) - new Date(start)) / 1000));
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `00:${m}:${s}`;
}

export default async function ReportQueuePage({ params }) {
  const { reportType } = await params;
  const report = getReportById(reportType);
  if (!report) notFound();

  const session = await auth();
  const isDonor = session?.user?.role === "donor";
  const { allowedProjects } = await resolveReportScope(session, "all");
  const allowedProjectIds = allowedProjects.map((p) => p.id);

  const currentUserId = session?.user?.id ? Number(session.user.id) : null;

  const allRequests = await prisma.reportRequest.findMany({
    where: {
      reportType,
      // Donors see: their own requests (whatever the scope), PLUS anyone's
      // requests that are explicitly scoped to one of their own projects.
      // An unrestricted "all projects" request made by someone else stays
      // hidden, since that would expose data outside the donor's scope.
      ...(isDonor
        ? {
            OR: [
              { requestedById: currentUserId },
              { projectId: { in: allowedProjectIds } },
            ],
          }
        : {}),
    },
    orderBy: { id: "desc" },
    take: 20,
  });
  const queue = allRequests.filter((r) => r.status === "Processing");
  const finished = allRequests.filter((r) => r.status === "Finished");

  const cellStyle = { padding: "9px 14px", borderBottom: "1px solid #DED2BC", fontSize: 13 };
  const headStyle = { ...cellStyle, textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "#665f52", background: "#F3EDE0" };
  const scopeLabel = (r) => r.projectName || (r.projectId ? "Restricted project" : "All projects in scope");
  const periodLabel = (r) =>
    r.startDate || r.endDate
      ? `${r.startDate ? new Date(r.startDate).toISOString().slice(0, 10) : "Start"} to ${r.endDate ? new Date(r.endDate).toISOString().slice(0, 10) : "Present"}`
      : "All time";

  return (
    <main style={{ margin: "0", padding: "40px 32px", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <QueuePoller hasProcessing={queue.length > 0} />

      <Link href="/reports" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#1B3A5C", textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={13} /> Back to report catalog
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>{report.name}</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <RefreshButton />
          <RequestReportModal projects={allowedProjects} reportType={report.id} reportName={report.name} reportDescription={report.description} />
        </div>
      </div>

      <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, overflow: "hidden", marginBottom: 22 }}>
        <div style={{ background: "#1B3A5C", color: "#fff", padding: "9px 14px", fontWeight: 700, fontSize: 13 }}>Summary</div>
        <div style={{ padding: 16, fontSize: 13.5 }}>
          <div><strong>Name:</strong> {report.name}</div>
          <div style={{ color: "#665f52", marginTop: 4 }}>{report.description}</div>
        </div>
      </div>

      <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, overflow: "hidden", marginBottom: 22 }}>
        <div style={{ background: "#1B3A5C", color: "#fff", padding: "9px 14px", fontWeight: 700, fontSize: 13 }}>Queue</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={headStyle}>Requested</th>
              <th style={headStyle}>By</th>
              <th style={headStyle}>Scope</th>
              <th style={headStyle}>Period</th>
              <th style={headStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 && (
              <tr><td colSpan={5} style={{ ...cellStyle, textAlign: "center", fontStyle: "italic", color: "#665f52" }}>None</td></tr>
            )}
            {queue.map((r) => (
              <tr key={r.id}>
                <td style={cellStyle}>{formatDateTime(r.createdAt)}</td>
                <td style={cellStyle}>{r.requestedByName}</td>
                <td style={cellStyle}>{scopeLabel(r)}</td>
                <td style={cellStyle}>{periodLabel(r)}</td>
                <td style={cellStyle}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: "#F6E7CC", color: "#8C6414" }}>PROCESSING</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ background: "#1B3A5C", color: "#fff", padding: "9px 14px", fontWeight: 700, fontSize: 13 }}>Finished</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={headStyle}>Requested</th>
              <th style={headStyle}>By</th>
              <th style={headStyle}>Scope</th>
              <th style={headStyle}>Period</th>
              <th style={headStyle}>Time taken</th>
              <th style={headStyle}>Download</th>
            </tr>
          </thead>
          <tbody>
            {finished.length === 0 && (
              <tr><td colSpan={6} style={{ ...cellStyle, textAlign: "center", fontStyle: "italic", color: "#665f52" }}>None</td></tr>
            )}
            {finished.map((r) => (
              <tr key={r.id}>
                <td style={cellStyle}>{formatDateTime(r.createdAt)}</td>
                <td style={cellStyle}>{r.requestedByName}</td>
                <td style={cellStyle}>{scopeLabel(r)}</td>
                <td style={cellStyle}>{periodLabel(r)}</td>
                <td style={cellStyle}>{timeTaken(r.createdAt, r.finishedAt)}</td>
                <td style={cellStyle}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link href={`/reports/view/${r.id}`} style={{ background: "#1B3A5C", color: "#fff", textDecoration: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>View</Link>
                    <Link href={`/api/reports/excel?requestId=${r.id}`} style={{ background: "#5C7A3D", color: "#fff", textDecoration: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>Excel</Link>
                    <Link href={`/api/reports/pdf?requestId=${r.id}`} style={{ background: "#B8442D", color: "#fff", textDecoration: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>PDF</Link>
                    <EncryptedDownloadButton requestId={r.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
