"use client";
import { useState } from "react";
import { setIndicatorFormula, removeIndicatorFormula, manualRecalculate } from "./actions";

const FIELD_OPTIONS = [
  { value: "sex", label: "Sex" },
  { value: "district", label: "District" },
  { value: "sector", label: "Sector" },
  { value: "age", label: "Age" },
];
const OPERATOR_OPTIONS = [
  { value: "count_all", label: "Count all beneficiaries in this project" },
  { value: "count_equals", label: "Count where field equals value" },
  { value: "count_gte", label: "Count where field ≥ value (age only)" },
  { value: "percent_equals", label: "% of beneficiaries where field equals value" },
];

const inputStyle = { padding: "6px 8px", borderRadius: 5, border: "1px solid #DED2BC", fontSize: 12, boxSizing: "border-box" };

export default function FormulaEditor({ indicatorId, projectId, formula, canEdit }) {
  const [editing, setEditing] = useState(false);
  const [operator, setOperator] = useState(formula?.operator || "count_all");
  const [field, setField] = useState(formula?.field || "sex");
  const [value, setValue] = useState(formula?.value || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const needsFieldValue = operator !== "count_all";

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const formData = new FormData();
    formData.set("field", field);
    formData.set("operator", operator);
    formData.set("value", value);
    const res = await setIndicatorFormula(indicatorId, projectId, formData);
    setBusy(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setEditing(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Remove this auto-calculation? The indicator's value will need manual updates again.")) return;
    setBusy(true);
    await removeIndicatorFormula(indicatorId, projectId);
    setBusy(false);
  }

  async function handleRecalculate() {
    setBusy(true);
    await manualRecalculate(indicatorId, projectId);
    setBusy(false);
  }

  if (!canEdit && !formula) return null;

  if (!editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
        {formula ? (
          <>
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "#DDE6EE", color: "#2E7D8C" }}>
              ⚡ Auto: {OPERATOR_OPTIONS.find((o) => o.value === formula.operator)?.label.split(" ")[0] || formula.operator}
              {formula.operator !== "count_all" && ` ${formula.field}=${formula.value}`}
            </span>
            {canEdit && (
              <>
                <button onClick={handleRecalculate} disabled={busy} style={{ background: "none", border: "none", color: "#1B3A5C", fontSize: 10.5, cursor: "pointer", textDecoration: "underline" }}>Recalculate</button>
                <button onClick={() => setEditing(true)} disabled={busy} style={{ background: "none", border: "none", color: "#1B3A5C", fontSize: 10.5, cursor: "pointer", textDecoration: "underline" }}>Edit</button>
                <button onClick={handleRemove} disabled={busy} style={{ background: "none", border: "none", color: "#B8442D", fontSize: 10.5, cursor: "pointer", textDecoration: "underline" }}>Remove</button>
              </>
            )}
          </>
        ) : (
          canEdit && (
            <button onClick={() => setEditing(true)} style={{ background: "none", border: "1px dashed #DED2BC", color: "#665f52", fontSize: 10.5, cursor: "pointer", borderRadius: 6, padding: "1px 8px" }}>
              + Auto-calculate from data
            </button>
          )
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} style={{ background: "#F3EDE0", borderRadius: 6, padding: 8, marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      <select value={operator} onChange={(e) => setOperator(e.target.value)} style={inputStyle}>
        {OPERATOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {needsFieldValue && (
        <>
          <select value={field} onChange={(e) => setField(e.target.value)} style={inputStyle}>
            {FIELD_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="value (e.g. Female)" style={{ ...inputStyle, width: 120 }} />
        </>
      )}
      <button type="submit" disabled={busy} style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 5, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
        {busy ? "Saving..." : "Save"}
      </button>
      <button type="button" onClick={() => setEditing(false)} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 5, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>
        Cancel
      </button>
      {error && <div style={{ width: "100%", background: "#F3DCD4", color: "#B8442D", fontSize: 11, padding: "5px 9px", borderRadius: 5 }}>{error}</div>}
    </form>
  );
}
