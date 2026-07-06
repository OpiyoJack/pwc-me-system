"use client";
import { useState } from "react";
import { updateMember, toggleMemberStatus } from "./actions";

export default function MemberRow({ m, projects, canEdit }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const cellStyle = { padding: "8px 10px", borderBottom: "1px solid #DED2BC", fontSize: 13.5, verticalAlign: "top" };
  const inputStyle = { padding: "5px 7px", borderRadius: 5, border: "1px solid #DED2BC", fontSize: 12.5, width: "100%", boxSizing: "border-box" };

  async function handleSubmit(formData) {
    setSaving(true);
    await updateMember(m.id, formData);
    setSaving(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <tr>
        <td style={cellStyle}>{m.name}</td>
        <td style={cellStyle}>{m.village}</td>
        <td style={cellStyle}>{m.district}</td>
        <td style={cellStyle}>{m.project ? m.project.name : "—"}</td>
        <td style={cellStyle}>
          <span style={{
            fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
            background: m.status === "Active" ? "#E4EBD9" : "#F6E7CC",
            color: m.status === "Active" ? "#5C7A3D" : "#8C6414",
          }}>
            {m.status}
          </span>
        </td>
        {canEdit && (
          <td style={cellStyle}>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setEditing(true)} style={{ background: "none", border: "1px solid #1B3A5C", color: "#1B3A5C", borderRadius: 6, padding: "3px 9px", fontSize: 11.5, cursor: "pointer" }}>
                Edit
              </button>
              <form action={toggleMemberStatus.bind(null, m.id, m.status)}>
                <button type="submit" style={{ background: "none", border: "1px solid #1B3A5C", color: "#1B3A5C", borderRadius: 6, padding: "3px 9px", fontSize: 11.5, cursor: "pointer" }}>
                  {m.status === "Active" ? "Mark pending" : "Verify"}
                </button>
              </form>
            </div>
          </td>
        )}
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={canEdit ? 6 : 5} style={{ ...cellStyle, background: "#F3EDE0" }}>
        <form action={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <input name="name" defaultValue={m.name} required style={inputStyle} />
          <input name="village" defaultValue={m.village} style={inputStyle} />
          <input name="district" defaultValue={m.district} style={inputStyle} />
          <select name="projectId" defaultValue={m.projectId || ""} style={{ ...inputStyle, gridColumn: "1 / -1" }}>
            <option value="">No specific project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, marginTop: 4 }}>
            <button type="submit" disabled={saving} style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "6px 14px", fontSize: 12.5, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
