"use client";
import { useState } from "react";
import { updateRisk, updateRiskStatus } from "./actions";

const LEVEL_COLOR = {
  Low: { bg: "#E4EBD9", fg: "#5C7A3D" },
  Medium: { bg: "#F6E7CC", fg: "#8C6414" },
  High: { bg: "#F3DCD4", fg: "#B8442D" },
};
const STATUS_COLOR = {
  Open: { bg: "#F3DCD4", fg: "#B8442D" },
  Mitigated: { bg: "#F6E7CC", fg: "#8C6414" },
  Closed: { bg: "#E4EBD9", fg: "#5C7A3D" },
};

function Badge({ text, color }) {
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: color.bg, color: color.fg }}>{text}</span>;
}

export default function RiskRow({ risk, projects, canEdit }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputStyle = { padding: "6px 8px", borderRadius: 5, border: "1px solid #DED2BC", fontSize: 12.5, width: "100%", boxSizing: "border-box" };

  async function handleSubmit(formData) {
    setSaving(true);
    await updateRisk(risk.id, formData);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 16, marginBottom: 10 }}>
      {!editing ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{risk.title}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Badge text={`Likelihood: ${risk.likelihood}`} color={LEVEL_COLOR[risk.likelihood]} />
              <Badge text={`Impact: ${risk.impact}`} color={LEVEL_COLOR[risk.impact]} />
              <Badge text={risk.status} color={STATUS_COLOR[risk.status]} />
            </div>
          </div>
          {risk.description && <div style={{ fontSize: 13, color: "#241D18", marginBottom: 6 }}>{risk.description}</div>}
          {risk.mitigation && (
            <div style={{ fontSize: 12.5, color: "#665f52", marginBottom: 8 }}>
              <strong>Mitigation:</strong> {risk.mitigation}
            </div>
          )}
          <div style={{ fontSize: 11.5, color: "#665f52", marginBottom: canEdit ? 10 : 0 }}>
            {risk.project ? risk.project.name : "No linked project"}
          </div>
          {canEdit && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => setEditing(true)} style={{ background: "none", border: "1px solid #1B3A5C", color: "#1B3A5C", borderRadius: 6, padding: "4px 10px", fontSize: 11.5, cursor: "pointer" }}>
                Edit
              </button>
              {["Open", "Mitigated", "Closed"].filter((s) => s !== risk.status).map((s) => (
                <form key={s} action={updateRiskStatus.bind(null, risk.id, s)}>
                  <button type="submit" style={{ background: "none", border: "1px solid #DED2BC", color: "#241D18", borderRadius: 6, padding: "4px 10px", fontSize: 11.5, cursor: "pointer" }}>
                    Mark {s}
                  </button>
                </form>
              ))}
            </div>
          )}
        </>
      ) : (
        <form action={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input name="title" defaultValue={risk.title} required style={{ ...inputStyle, gridColumn: "1 / -1" }} />
          <textarea name="description" defaultValue={risk.description || ""} placeholder="Description" style={{ ...inputStyle, gridColumn: "1 / -1", minHeight: 50 }} />
          <select name="likelihood" defaultValue={risk.likelihood} style={inputStyle}>
            <option>Low</option><option>Medium</option><option>High</option>
          </select>
          <select name="impact" defaultValue={risk.impact} style={inputStyle}>
            <option>Low</option><option>Medium</option><option>High</option>
          </select>
          <textarea name="mitigation" defaultValue={risk.mitigation || ""} placeholder="Mitigation plan" style={{ ...inputStyle, gridColumn: "1 / -1", minHeight: 50 }} />
          <select name="projectId" defaultValue={risk.projectId || ""} style={{ ...inputStyle, gridColumn: "1 / -1" }}>
            <option value="">No specific project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "6px 14px", fontSize: 12.5, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
