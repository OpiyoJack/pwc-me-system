"use client";
import { useState } from "react";
import { requestReport } from "./actions";
import { useSession } from "next-auth/react";

export default function RequestReportModal({ projects, reportType, reportName, reportDescription }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputStyle = { padding: "8px 10px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13.5, width: "100%", boxSizing: "border-box" };

  const [dateError, setDateError] = useState("");
  const [startDate, setStartDate] = useState("");

  async function handleSubmit(formData) {
    const start = formData.get("startDate");
    const end = formData.get("endDate");
    if (start && end && new Date(end) < new Date(start)) {
      setDateError("End date cannot be before the start date.");
      return;
    }
    setDateError("");
    formData.set("requestedByName", session?.user?.name || "Unknown user");
    formData.set("requestedById", session?.user?.id || "");
    formData.set("reportType", reportType);
    formData.set("reportName", reportName);
    formData.set("reportDescription", reportDescription || "");
    setSubmitting(true);
    await requestReport(formData);
    setSubmitting(false);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 8, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, color: "#1B3A5C", cursor: "pointer" }}
      >
        ▶ Request report
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(18,14,10,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#FBF8F2", borderRadius: 12, padding: 0, width: 460, maxWidth: "100%", border: "1px solid #DED2BC", overflow: "hidden" }}>
            <div style={{ background: "#1B3A5C", color: "#fff", padding: "12px 20px", fontWeight: 700, fontSize: 14 }}>
              Request Report
            </div>
            <form action={handleSubmit} style={{ padding: 20 }}>
              <div style={{ fontSize: 11, color: "#665f52", textTransform: "uppercase", marginBottom: 4 }}>Report</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{reportName}</div>

              {dateError && <div style={{ background: "#F3DCD4", color: "#B8442D", fontSize: 12.5, padding: "8px 12px", borderRadius: 6, marginBottom: 12 }}>{dateError}</div>}
              <div style={{ fontSize: 11, color: "#665f52", textTransform: "uppercase", marginBottom: 8 }}>Date range</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, display: "block", marginBottom: 4 }}>Start date</label>
                  <input name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, display: "block", marginBottom: 4 }}>End date</label>
                  <input name="endDate" type="date" min={startDate || undefined} style={inputStyle} />
                </div>
              </div>

              <div style={{ fontSize: 11, color: "#665f52", textTransform: "uppercase", marginBottom: 8 }}>Scope</div>
              <select name="projectId" defaultValue="" style={{ ...inputStyle, marginBottom: 20 }}>
                <option value="">All projects in my scope</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" disabled={submitting} style={{ background: "#5C7A3D", color: "#fff", border: "none", borderRadius: 6, padding: "9px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                  ▶ {submitting ? "Requesting..." : "Request"}
                </button>
                <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "1px solid #B8442D", color: "#B8442D", borderRadius: 6, padding: "9px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                  ✕ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
