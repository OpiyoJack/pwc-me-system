"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import { IMPORT_TARGETS, suggestMapping } from "./mapping-helpers";
import { runImport } from "./actions";

const inputStyle = { padding: "7px 9px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 12.5, width: "100%", boxSizing: "border-box" };

export default function ImportCard({ targetKey, icon, accentColor, projects }) {
  const targetDef = IMPORT_TARGETS[targetKey];
  const [rows, setRows] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [showMapping, setShowMapping] = useState(false);
  const [fileError, setFileError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState("");

  function downloadTemplate() {
    window.location.href = `/api/import/template?target=${targetKey}`;
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames.includes("Data") ? "Data" : workbook.SheetNames[0];
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

        if (json.length === 0) {
          setFileError("No data rows found in this file.");
          setRows(null);
          return;
        }

        const foundHeaders = Object.keys(json[0]).map((h) => h.replace(/\s*\*$/, ""));
        const suggested = suggestMapping(targetKey, foundHeaders);
        const allRequiredMatched = targetDef.fields.filter((f) => f.required).every((f) => suggested[f.key]);

        setHeaders(foundHeaders);
        setMapping(suggested);
        setRows(json.map((row) => {
          const clean = {};
          Object.keys(row).forEach((k) => { clean[k.replace(/\s*\*$/, "")] = row[k]; });
          return clean;
        }));
        setShowMapping(!allRequiredMatched);
      } catch {
        setFileError("Could not read this file. Use .xlsx, .xls, or .csv.");
        setRows(null);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function getMappedRows() {
    return rows.map((row) => {
      const mapped = {};
      targetDef.fields.forEach((f) => { mapped[f.key] = mapping[f.key] ? row[mapping[f.key]] : ""; });
      return mapped;
    });
  }

  async function handleImport() {
    setImporting(true);
    const mappedRows = getMappedRows();
    const res = await runImport(targetKey, mappedRows, projects);
    setResult(res);
    setImporting(false);
  }

  function reset() {
    setRows(null);
    setHeaders([]);
    setMapping({});
    setShowMapping(false);
    setResult(null);
    setFileError("");
    setFileName("");
  }

  const missingRequired = rows ? targetDef.fields.filter((f) => f.required && !mapping[f.key]) : [];

  return (
    <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 4, background: accentColor }} />
      <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{targetDef.label}</div>
        </div>
        <p style={{ fontSize: 12.5, color: "#665f52", marginBottom: 12 }}>{targetDef.notes}</p>

        <button
          type="button"
          onClick={downloadTemplate}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: "none", border: `1px solid ${accentColor}`, color: accentColor, borderRadius: 6, padding: "8px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", marginBottom: 14 }}
        >
          ↓ Download Template
        </button>

        <label style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", marginBottom: 5, display: "block" }}>Select file (.xlsx, .xls, .csv)</label>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ fontSize: 12, marginBottom: 12 }} />

        {fileError && <div style={{ background: "#F3DCD4", color: "#B8442D", fontSize: 12, padding: "7px 10px", borderRadius: 6, marginBottom: 10 }}>{fileError}</div>}

        {rows && !result && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#665f52", marginBottom: 8 }}>{rows.length} row(s) found in {fileName}</div>

            {showMapping && (
              <div style={{ display: "grid", gap: 6, marginBottom: 10, background: "#F3EDE0", borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 2 }}>Some columns need mapping:</div>
                {targetDef.fields.map((f) => (
                  <div key={f.key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, alignItems: "center" }}>
                    <label style={{ fontSize: 11.5 }}>{f.label}{f.required && <span style={{ color: "#B8442D" }}> *</span>}</label>
                    <select value={mapping[f.key] || ""} onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))} style={inputStyle}>
                      <option value="">— Not mapped —</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {missingRequired.length > 0 && (
              <div style={{ background: "#F3DCD4", color: "#B8442D", fontSize: 11.5, padding: "6px 10px", borderRadius: 6, marginBottom: 10 }}>
                Please map: {missingRequired.map((f) => f.label).join(", ")}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={handleImport}
                disabled={missingRequired.length > 0 || importing}
                style={{ background: accentColor, color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: missingRequired.length > 0 ? "not-allowed" : "pointer", opacity: missingRequired.length > 0 ? 0.5 : 1 }}
              >
                {importing ? "Importing..." : "↑ Upload & Import"}
              </button>
              <button type="button" onClick={reset} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "8px 14px", fontSize: 12.5, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {result && (
          <div style={{ background: "#F3EDE0", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#5C7A3D" }}>{result.created} imported</div>
            {result.skipped.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11.5, color: "#B8442D", fontWeight: 700, marginBottom: 4 }}>{result.skipped.length} row(s) skipped:</div>
                <div style={{ display: "grid", gap: 3, maxHeight: 140, overflowY: "auto" }}>
                  {result.skipped.map((s, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#665f52" }}>Row {s.row}: {s.reason}</div>
                  ))}
                </div>
              </div>
            )}
            <button type="button" onClick={reset} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>
              Import another file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
