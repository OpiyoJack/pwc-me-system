"use client";
import { useState } from "react";
import { importFromKobo } from "./kobo-actions";

const inputStyle = { padding: "8px 10px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 12.5, width: "100%", boxSizing: "border-box" };

export default function KoboImportCard({ projects }) {
  const [apiToken, setApiToken] = useState("");
  const [formUid, setFormUid] = useState("");
  const [server, setServer] = useState("https://kf.kobotoolbox.org");
  const [defaultSector, setDefaultSector] = useState("education");
  const [projectId, setProjectId] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleConnect() {
    setError("");
    setResult(null);
    setImporting(true);
    const res = await importFromKobo({ apiToken, formUid, server, defaultSector, projectId });
    setImporting(false);
    if (res.error) setError(res.error);
    else setResult(res);
  }

  function reset() {
    setResult(null);
    setError("");
  }

  return (
    <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 4, background: "#5B4B8A" }} />
      <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>📱</span>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>Import from KoboCollect / KoboToolbox</div>
        </div>
        <p style={{ fontSize: 12.5, color: "#665f52", marginBottom: 14 }}>
          Connect directly to KoboToolbox to pull beneficiary submissions from a KoboCollect form. Find your
          API token at <strong>kf.kobotoolbox.org</strong> → Account Settings → Security → API Key.
        </p>

        <div style={{ background: "#F3EDE0", borderRadius: 8, padding: 10, fontSize: 11.5, color: "#665f52", marginBottom: 14 }}>
          KoboCollect field names should roughly match: <strong>full_name, gender, age (or age_group), district, village, phone_number</strong>.
        </div>

        <label style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", marginBottom: 4, display: "block" }}>KoboToolbox Server</label>
        <input value={server} onChange={(e) => setServer(e.target.value)} placeholder="https://kf.kobotoolbox.org" style={{ ...inputStyle, marginBottom: 10 }} />

        <label style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", marginBottom: 4, display: "block" }}>API Token</label>
        <input type="password" value={apiToken} onChange={(e) => setApiToken(e.target.value)} placeholder="e.g. a1b2c3d4e5f6..." style={{ ...inputStyle, marginBottom: 10 }} />

        <label style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", marginBottom: 4, display: "block" }}>Form UID (Asset UID)</label>
        <input value={formUid} onChange={(e) => setFormUid(e.target.value)} placeholder="e.g. aXYZ123abc" style={{ ...inputStyle, marginBottom: 10 }} />

        <label style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", marginBottom: 4, display: "block" }}>Default Sector</label>
        <select value={defaultSector} onChange={(e) => setDefaultSector(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }}>
          <option value="education">Education</option>
          <option value="economic">Women's Economic Empowerment</option>
          <option value="rights">Rights & Leadership</option>
          <option value="health">Health</option>
          <option value="water">Water</option>
          <option value="climate">Climate Change</option>
        </select>

        <label style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", marginBottom: 4, display: "block" }}>Link to Project (optional)</label>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ ...inputStyle, marginBottom: 14 }}>
          <option value="">— No project —</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {error && <div style={{ background: "#F3DCD4", color: "#B8442D", fontSize: 12, padding: "7px 10px", borderRadius: 6, marginBottom: 10 }}>{error}</div>}

        {!result && (
          <button
            onClick={handleConnect}
            disabled={importing}
            style={{ background: "#5B4B8A", color: "#fff", border: "none", borderRadius: 6, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: importing ? "not-allowed" : "pointer" }}
          >
            {importing ? "Connecting..." : "🔗 Connect & Import"}
          </button>
        )}

        {result && (
          <div style={{ background: "#F3EDE0", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#5C7A3D" }}>
              {result.created} imported from {result.fetchedFromKobo} submissions
            </div>
            {result.skipped.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11.5, color: "#B8442D", fontWeight: 700, marginBottom: 4 }}>{result.skipped.length} row(s) skipped:</div>
                <div style={{ display: "grid", gap: 3, maxHeight: 120, overflowY: "auto" }}>
                  {result.skipped.slice(0, 20).map((s, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#665f52" }}>Row {s.row}: {s.reason}</div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={reset} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>
              Import another form
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
