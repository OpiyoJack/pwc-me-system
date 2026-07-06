"use client";
import { useState } from "react";
import { updateProjectAssignments } from "./actions";

const STATUS_COLOR = {
  Planned: { bg: "#DDE6EE", fg: "#2E7D8C" },
  Ongoing: { bg: "#E4EBD9", fg: "#5C7A3D" },
  Completed: { bg: "#E4E1F0", fg: "#5B4B8A" },
  "On Hold": { bg: "#F6E7CC", fg: "#8C6414" },
  Terminated: { bg: "#F3DCD4", fg: "#B8442D" },
};

export default function AssignmentPicker({ project, coordinators, donors, canEdit, effectiveStatus }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState("");
  const [startDate, setStartDate] = useState(project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : "");
  const inputStyle = { padding: "6px 8px", borderRadius: 5, border: "1px solid #DED2BC", fontSize: 12, boxSizing: "border-box" };
  const statusColor = STATUS_COLOR[effectiveStatus] || STATUS_COLOR.Ongoing;
  const isManualOverride = project.status === "On Hold" || project.status === "Terminated";

  async function handleSubmit(formData) {
    const start = formData.get("startDate");
    const end = formData.get("endDate");
    if (start && end && new Date(end) < new Date(start)) {
      setDateError("End date cannot be before the start date.");
      return;
    }
    setDateError("");
    setSaving(true);
    await updateProjectAssignments(project.id, formData);
    setSaving(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", fontSize: 12, color: "#665f52", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: statusColor.bg, color: statusColor.fg }}>
          {effectiveStatus}{!isManualOverride && " (auto)"}
        </span>
        <span><strong>Coordinator:</strong> {project.coordinator ? project.coordinator.name : "Unassigned"}</span>
        <span><strong>Donor contact:</strong> {project.donorContact ? project.donorContact.name : "Unassigned"}</span>
        {project.budget && <span><strong>Budget:</strong> TSh {project.budget.toLocaleString()}</span>}
        {project.startDate && <span><strong>Start:</strong> {new Date(project.startDate).toISOString().slice(0, 10)}</span>}
        {project.endDate && <span><strong>End:</strong> {new Date(project.endDate).toISOString().slice(0, 10)}</span>}
        {canEdit && (
          <button onClick={() => setEditing(true)} style={{ background: "none", border: "1px solid #DED2BC", color: "#241D18", borderRadius: 6, padding: "2px 8px", fontSize: 11.5, cursor: "pointer" }}>
            Edit
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      {dateError && <div style={{ background: "#F3DCD4", color: "#B8442D", fontSize: 12, padding: "6px 10px", borderRadius: 6, marginBottom: 8 }}>{dateError}</div>}
      <form action={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "#F3EDE0", borderRadius: 8, padding: 8 }}>
        <select name="status" defaultValue={isManualOverride ? project.status : "Ongoing"} style={inputStyle}>
          <option value="Ongoing">Auto (based on dates)</option>
          <option>On Hold</option>
          <option>Terminated</option>
        </select>
        <select name="coordinatorId" defaultValue={project.coordinatorId || ""} style={inputStyle}>
          <option value="">No coordinator</option>
          {coordinators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="donorContactId" defaultValue={project.donorContactId || ""} style={inputStyle}>
          <option value="">No donor contact</option>
          {donors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input name="budget" type="number" placeholder="Budget (TSh)" defaultValue={project.budget || ""} style={{ ...inputStyle, width: 120 }} />
        <input name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        <input name="endDate" type="date" min={startDate || undefined} defaultValue={project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : ""} style={inputStyle} />
        <button type="submit" disabled={saving} style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={() => setEditing(false)} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, cursor: "pointer" }}>
          Cancel
        </button>
      </form>
    </div>
  );
}
