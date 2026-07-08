"use client";
import { useState } from "react";
import { updateIndicatorActual, updateIndicatorDetails } from "./update-actions";
import FormulaEditor from "./formula/FormulaEditor";

function ProgressBar({ actual, target, unit }) {
  const pct = target > 0 ? Math.min(actual / target, 1) : 0;
  const color = pct >= 0.8 ? "#5C7A3D" : pct >= 0.4 ? "#D9A441" : "#B8442D";
  return (
    <div style={{ background: "#EDE6D8", borderRadius: 6, height: 7, overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${pct * 100}%`, background: color, height: "100%", borderRadius: 6, transition: "width 0.3s" }} />
    </div>
  );
}

export default function IndicatorProgress({ indicator, canEdit, projectId }) {
  const [open, setOpen] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputStyle = { padding: "7px 9px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13, width: "100%", boxSizing: "border-box" };
  const pct = indicator.target > 0 ? Math.round((indicator.actual / indicator.target) * 100) : 0;
  const pid = projectId || indicator.projectId;
  const isAutoCalculated = !!indicator.formula;

  async function handleSubmit(formData) {
    setSubmitting(true);
    await updateIndicatorActual(indicator.id, formData);
    setSubmitting(false);
    setOpen(false);
  }

  async function handleDetailsSubmit(formData) {
    setSubmitting(true);
    await updateIndicatorDetails(indicator.id, pid, formData);
    setSubmitting(false);
    setEditingDetails(false);
  }

  return (
    <div style={{ padding: "10px 0", borderTop: "1px solid #EDE6D8" }}>
      {editingDetails ? (
        <form action={handleDetailsSubmit} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, background: "#F3EDE0", borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <input name="name" defaultValue={indicator.name} required style={inputStyle} placeholder="Indicator name" />
          <input name="target" type="number" defaultValue={indicator.target} required style={inputStyle} placeholder="Target" />
          <input name="unit" defaultValue={indicator.unit} required style={inputStyle} placeholder="Unit" />
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button type="submit" disabled={submitting} style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {submitting ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => setEditingDetails(false)} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 7 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{indicator.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {indicator.actual.toLocaleString()} / {indicator.target.toLocaleString()} {indicator.unit}
            </span>
            {canEdit && (
              <>
                <button onClick={() => setEditingDetails(true)} style={{ background: "none", color: "#665f52", border: "1px solid #DED2BC", borderRadius: 6, padding: "3px 10px", fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Edit
                </button>
                {!isAutoCalculated && (
                  <button
                    onClick={() => setOpen((o) => !o)}
                    style={{ background: open ? "#1B3A5C" : "none", color: open ? "#fff" : "#1B3A5C", border: "1px solid #1B3A5C", borderRadius: 6, padding: "3px 10px", fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {open ? "Cancel" : "Update"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProgressBar actual={indicator.actual} target={indicator.target} unit={indicator.unit} />
        <span style={{ fontSize: 11, color: "#665f52", width: 34, textAlign: "right" }}>{pct}%</span>
      </div>

      <FormulaEditor indicatorId={indicator.id} projectId={pid} formula={indicator.formula} canEdit={canEdit} />

      {open && !isAutoCalculated && (
        <form
          action={handleSubmit}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10, background: "#F3EDE0", borderRadius: 8, padding: 12 }}
        >
          <input
            name="newActual"
            type="number"
            step="any"
            placeholder={`New actual (${indicator.unit})`}
            defaultValue={indicator.actual}
            required
            style={inputStyle}
          />
          <input name="note" placeholder="Note (optional)" style={inputStyle} />
          <button
            type="submit"
            disabled={submitting}
            style={{ gridColumn: "1 / -1", background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "8px 12px", fontSize: 12.5, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Saving..." : "Save update"}
          </button>
        </form>
      )}
    </div>
  );
}
