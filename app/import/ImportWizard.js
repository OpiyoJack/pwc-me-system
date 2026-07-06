"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import { IMPORT_TARGETS, suggestMapping } from "./mapping-helpers";
import { importBeneficiaries } from "./actions";

const inputStyle = { padding: "8px 10px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13.5, width: "100%", boxSizing: "border-box" };
const cardStyle = { background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 20 };

export default function ImportWizard({ projects }) {
  const [target, setTarget] = useState("beneficiaries");
  const [step, setStep] = useState(1); // 1: upload, 2: map, 3: preview/result
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [fileError, setFileError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const targetDef = IMPORT_TARGETS[target];

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (json.length === 0) {
          setFileError("This file appears to have no data rows.");
          return;
        }

        const foundHeaders = Object.keys(json[0]);
        setHeaders(foundHeaders);
        setRows(json);
        setMapping(suggestMapping(target, foundHeaders));
        setStep(2);
      } catch (err) {
        setFileError("Could not read this file. Make sure it's a valid Excel (.xlsx/.xls) or CSV file.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function updateMapping(fieldKey, header) {
    setMapping((prev) => ({ ...prev, [fieldKey]: header }));
  }

  function getMappedRows() {
    return rows.map((row) => {
      const mapped = {};
      targetDef.fields.forEach((f) => {
        const header = mapping[f.key];
        mapped[f.key] = header ? row[header] : "";
      });
      return mapped;
    });
  }

  async function handleConfirm() {
    setImporting(true);
    const mappedRows = getMappedRows();
    const res = await importBeneficiaries(mappedRows, projects);
    setResult(res);
    setImporting(false);
    setStep(3);
  }

  function reset() {
    setStep(1);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    setFileError("");
  }

  const missingRequired = targetDef.fields.filter((f) => f.required && !mapping[f.key]);

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#665f52", textTransform: "uppercase", marginBottom: 8 }}>Import into</div>
        <select value={target} onChange={(e) => { setTarget(e.target.value); reset(); }} style={{ ...inputStyle, maxWidth: 260 }}>
          {Object.entries(IMPORT_TARGETS).map(([key, t]) => <option key={key} value={key}>{t.label}</option>)}
        </select>
      </div>

      {step === 1 && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Step 1 — Upload your file</div>
          <p style={{ fontSize: 13, color: "#665f52", marginBottom: 14 }}>
            Accepts .xlsx, .xls, or .csv — export your KOBO/SurveyMonkey/Google Form responses to one of these formats first.
          </p>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
          {fileError && <div style={{ marginTop: 12, background: "#F3DCD4", color: "#B8442D", fontSize: 12.5, padding: "8px 12px", borderRadius: 6 }}>{fileError}</div>}
        </div>
      )}

      {step === 2 && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Step 2 — Map your columns</div>
          <p style={{ fontSize: 12.5, color: "#665f52", marginBottom: 16 }}>
            {rows.length} row{rows.length !== 1 ? "s" : ""} found. We've pre-matched columns where possible — adjust anything that looks wrong.
          </p>

          <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
            {targetDef.fields.map((f) => (
              <div key={f.key} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 10, alignItems: "center" }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>
                  {f.label}{f.required && <span style={{ color: "#B8442D" }}> *</span>}
                </label>
                <select value={mapping[f.key] || ""} onChange={(e) => updateMapping(f.key, e.target.value)} style={inputStyle}>
                  <option value="">— Not mapped —</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#665f52", marginBottom: 8 }}>Preview (first 5 rows)</div>
          <div style={{ overflowX: "auto", marginBottom: 18 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {targetDef.fields.map((f) => (
                    <th key={f.key} style={{ textAlign: "left", padding: "6px 8px", background: "#F3EDE0", borderBottom: "1px solid #DED2BC" }}>{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getMappedRows().slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {targetDef.fields.map((f) => (
                      <td key={f.key} style={{ padding: "6px 8px", borderBottom: "1px solid #EDE6D8" }}>{String(row[f.key] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {missingRequired.length > 0 && (
            <div style={{ background: "#F3DCD4", color: "#B8442D", fontSize: 12.5, padding: "8px 12px", borderRadius: 6, marginBottom: 14 }}>
              Please map: {missingRequired.map((f) => f.label).join(", ")} before continuing.
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleConfirm}
              disabled={missingRequired.length > 0 || importing}
              style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "9px 18px", fontSize: 13.5, fontWeight: 600, cursor: missingRequired.length > 0 ? "not-allowed" : "pointer", opacity: missingRequired.length > 0 ? 0.5 : 1 }}
            >
              {importing ? "Importing..." : `Import ${rows.length} row${rows.length !== 1 ? "s" : ""}`}
            </button>
            <button onClick={reset} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "9px 18px", fontSize: 13.5, cursor: "pointer" }}>
              Start over
            </button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Import complete</div>
          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#5C7A3D" }}>{result.created}</div>
              <div style={{ fontSize: 12, color: "#665f52" }}>Created</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: result.skipped.length > 0 ? "#B8442D" : "#665f52" }}>{result.skipped.length}</div>
              <div style={{ fontSize: 12, color: "#665f52" }}>Skipped</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{result.total}</div>
              <div style={{ fontSize: 12, color: "#665f52" }}>Total rows</div>
            </div>
          </div>

          {result.skipped.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Skipped rows:</div>
              <div style={{ display: "grid", gap: 4, maxHeight: 160, overflowY: "auto" }}>
                {result.skipped.map((s, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#665f52" }}>Row {s.row}: {s.reason}</div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <a href="/beneficiaries" style={{ background: "#1B3A5C", color: "#fff", textDecoration: "none", borderRadius: 6, padding: "9px 18px", fontSize: 13.5, fontWeight: 600 }}>
              View beneficiaries
            </a>
            <button onClick={reset} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "9px 18px", fontSize: 13.5, cursor: "pointer" }}>
              Import another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
