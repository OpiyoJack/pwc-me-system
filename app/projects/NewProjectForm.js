"use client";
import { useState } from "react";
import { addProject } from "./actions";
import TZ_DISTRICTS from "../../lib/tanzania-districts";

const inputStyle = { padding: "8px 10px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13.5, width: "100%", boxSizing: "border-box" };
const SECTORS = [
  { id: "education", label: "Education" },
  { id: "economic", label: "Women's Economic Empowerment" },
  { id: "rights", label: "Rights & Leadership" },
  { id: "health", label: "Health" },
  { id: "water", label: "Water" },
  { id: "climate", label: "Climate Change" },
];

export default function NewProjectForm({ districts, coordinators, donors }) {
  const [open, setOpen] = useState(false);
  const [indicators, setIndicators] = useState([{ name: "", target: "", unit: "" }]);
  const [submitting, setSubmitting] = useState(false);

  const updateIndicator = (idx, field, value) => {
    setIndicators((prev) => prev.map((ind, i) => (i === idx ? { ...ind, [field]: value } : ind)));
  };
  const addIndicatorRow = () => setIndicators((prev) => [...prev, { name: "", target: "", unit: "" }]);
  const removeIndicatorRow = (idx) => setIndicators((prev) => prev.filter((_, i) => i !== idx));

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
    setSubmitting(true);
    formData.set("indicatorsJson", JSON.stringify(indicators));
    await addProject(formData);
    setIndicators([{ name: "", target: "", unit: "" }]);
    setSubmitting(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginBottom: 24 }}
      >
        + New project
      </button>
    );
  }

  return (
    <form
      action={handleSubmit}
      style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 18, marginBottom: 28 }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>New project</div>
      {dateError && <div style={{ background: "#F3DCD4", color: "#B8442D", fontSize: 12.5, padding: "8px 12px", borderRadius: 6, marginBottom: 12 }}>{dateError}</div>}

      <div className="form-grid" style={{ marginBottom: 14 }}>
        <input name="name" placeholder="Project name" required style={inputStyle} />
        <select name="sector" style={inputStyle} defaultValue="education">
          {SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select name="status" style={inputStyle} defaultValue="Ongoing">
          <option value="Ongoing">Auto (based on dates)</option>
          <option>On Hold</option>
          <option>Terminated</option>
        </select>
        <input name="budget" type="number" placeholder="Budget (TSh)" style={inputStyle} />
        <div>
          <label style={{ fontSize: 10.5, color: "#665f52" }}>Start date</label>
          <input name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 10.5, color: "#665f52" }}>Expected end date</label>
          <input name="endDate" type="date" min={startDate || undefined} style={inputStyle} />
        </div>
        <select name="district" required style={inputStyle} defaultValue="">
          <option value="">Select district</option>
          {TZ_DISTRICTS.map((r) => (
            <optgroup key={r.region} label={r.region}>
              {r.districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </optgroup>
          ))}
        </select>
        <select name="coordinatorId" defaultValue="" style={inputStyle}>
          <option value="">Assign coordinator (optional)</option>
          {coordinators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="donorContactId" defaultValue="" style={inputStyle}>
          <option value="">Assign donor contact (optional)</option>
          {donors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.65, marginBottom: 8 }}>INDICATORS</div>
      <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
        {indicators.map((ind, idx) => (
          <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
            <input
              placeholder="Indicator name"
              value={ind.name}
              onChange={(e) => updateIndicator(idx, "name", e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Target"
              type="number"
              value={ind.target}
              onChange={(e) => updateIndicator(idx, "target", e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Unit"
              value={ind.unit}
              onChange={(e) => updateIndicator(idx, "unit", e.target.value)}
              style={inputStyle}
            />
            {indicators.length > 1 && (
              <button type="button" onClick={() => removeIndicatorRow(idx)} style={{ background: "none", border: "1px solid #B8442D", color: "#B8442D", borderRadius: 6, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={addIndicatorRow} style={{ background: "none", border: "1px solid #1B3A5C", color: "#1B3A5C", borderRadius: 6, padding: "6px 12px", fontSize: 12.5, cursor: "pointer", marginBottom: 16 }}>
        + Add indicator
      </button>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="submit"
          disabled={submitting}
          style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? "Saving..." : "Save project"}
        </button>
        <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "1px solid #DED2BC", color: "#241D18", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
