"use client";
import { useState } from "react";
import { updateBeneficiary } from "./actions";
import TZ_DISTRICTS from "../../lib/tanzania-districts";

const SECTORS = [
  { id: "education", label: "Education" },
  { id: "economic", label: "Women's Economic Empowerment" },
  { id: "rights", label: "Rights & Leadership" },
  { id: "health", label: "Health" },
  { id: "water", label: "Water" },
  { id: "climate", label: "Climate Change" },
];

export default function BeneficiaryRow({ b, projects, canEdit }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const cellStyle = { padding: "8px 10px", borderBottom: "1px solid #DED2BC", fontSize: 13.5, verticalAlign: "top" };
  const inputStyle = { padding: "5px 7px", borderRadius: 5, border: "1px solid #DED2BC", fontSize: 12.5, width: "100%", boxSizing: "border-box" };

  async function handleSubmit(formData) {
    setSaving(true);
    await updateBeneficiary(b.id, formData);
    setSaving(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <tr>
        <td style={cellStyle}>{b.name}</td>
        <td style={cellStyle}>{b.phone || "—"}</td>
        <td style={cellStyle}>{b.sex}</td>
        <td style={cellStyle}>{b.age}</td>
        <td style={cellStyle}>{b.district}</td>
        <td style={cellStyle}>{b.sector}</td>
        <td style={cellStyle}>{b.project ? b.project.name : "—"}</td>
        {canEdit && (
          <td style={cellStyle}>
            <button onClick={() => setEditing(true)} style={{ background: "none", border: "1px solid #1B3A5C", color: "#1B3A5C", borderRadius: 6, padding: "3px 9px", fontSize: 11.5, cursor: "pointer" }}>
              Edit
            </button>
          </td>
        )}
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={canEdit ? 8 : 7} style={{ ...cellStyle, background: "#F3EDE0" }}>
        <form action={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <input name="name" defaultValue={b.name} required style={inputStyle} placeholder="Full name" />
          <input name="phone" defaultValue={b.phone || ""} style={inputStyle} placeholder="Phone number" />
          <select name="sex" defaultValue={b.sex} style={inputStyle}>
            <option>Female</option><option>Male</option>
          </select>
          <input name="age" type="number" defaultValue={b.age} style={inputStyle} placeholder="Age" />
          <select name="district" defaultValue={b.district} style={inputStyle}>
            {TZ_DISTRICTS.map((r) => (
              <optgroup key={r.region} label={r.region}>
                {r.districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </optgroup>
            ))}
          </select>
          <select name="sector" defaultValue={b.sector} style={inputStyle}>
            {SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select name="projectId" defaultValue={b.projectId || ""} style={{ ...inputStyle, gridColumn: "1 / -1" }}>
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
