"use client";
import { useState } from "react";

export default function EncryptedDownloadButton({ requestId }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState("excel");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setError("");
    if (password.length < 4) { setError("Password must be at least 4 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    setBusy(true);
    try {
      const res = await fetch("/api/reports/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, format, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not create the encrypted file.");
        setBusy(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `secure-report-${requestId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
      setPassword("");
      setConfirmPassword("");
    } catch (e) {
      setError("Something went wrong creating the encrypted file.");
    }
    setBusy(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ background: "#5B4B8A", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
      >
        🔒 Encrypted
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(18,14,10,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }} onClick={() => !busy && setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#FBF8F2", borderRadius: 12, padding: 22, width: 380, maxWidth: "100%", border: "1px solid #DED2BC" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Download as encrypted ZIP</div>
            <div style={{ fontSize: 12, color: "#665f52", marginBottom: 16 }}>
              Set a password to protect this file. Share it with the recipient through a separate, secure channel (not the same email as the file itself).
              Note: opening it requires <strong>7-Zip or WinZip</strong> — it won't work with Windows' built-in "Extract All."
            </div>

            <label style={{ display: "block", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>FORMAT</div>
              <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13, width: "100%", boxSizing: "border-box" }}>
                <option value="excel">Excel (.xlsx)</option>
                <option value="pdf">PDF</option>
              </select>
            </label>

            <label style={{ display: "block", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>PASSWORD</div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
            </label>
            <label style={{ display: "block", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>CONFIRM PASSWORD</div>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
            </label>

            {error && <div style={{ background: "#F3DCD4", color: "#B8442D", fontSize: 12.5, padding: "8px 12px", borderRadius: 6, marginBottom: 12 }}>{error}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleDownload} disabled={busy} style={{ background: "#5B4B8A", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                {busy ? "Encrypting..." : "Download"}
              </button>
              <button onClick={() => setOpen(false)} disabled={busy} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
