"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { startMfaSetup, confirmMfaSetup, disableOwnMfa } from "./actions";

const cardStyle = { background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 22 };
const inputStyle = { padding: "10px 12px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 15, width: "100%", boxSizing: "border-box", letterSpacing: "0.2em", textAlign: "center" };

export default function MfaSetupPanel({ mfaEnabled }) {
  const router = useRouter();
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleStart() {
    setBusy(true);
    setError("");
    const res = await startMfaSetup();
    setBusy(false);
    if (res.error) setError(res.error);
    else setSetupData(res);
  }

  async function handleConfirm() {
    setBusy(true);
    setError("");
    const res = await confirmMfaSetup(code);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSetupData(null);
      setCode("");
      router.refresh();
    }
  }

  async function handleDisable() {
    if (!confirm("Turn off two-factor authentication for your account?")) return;
    setBusy(true);
    await disableOwnMfa();
    setBusy(false);
    router.refresh();
  }

  if (mfaEnabled) {
    return (
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#E4EBD9", color: "#5C7A3D" }}>
            ENABLED
          </span>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Two-factor authentication</div>
        </div>
        <p style={{ fontSize: 13, color: "#665f52", marginBottom: 16 }}>
          Your account requires a code from your authenticator app in addition to your password when signing in.
        </p>
        <button onClick={handleDisable} disabled={busy} style={{ background: "none", border: "1px solid #B8442D", color: "#B8442D", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          {busy ? "Working..." : "Turn off two-factor authentication"}
        </button>
      </div>
    );
  }

  if (setupData) {
    return (
      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Scan this QR code</div>
        <p style={{ fontSize: 13, color: "#665f52", marginBottom: 16 }}>
          Open Google Authenticator, Authy, or a similar app, and scan the code below. Then enter the 6-digit code it shows to confirm setup.
        </p>
        <img src={setupData.qrDataUrl} alt="MFA QR code" style={{ width: 200, height: 200, marginBottom: 16, display: "block" }} />
        <div style={{ fontSize: 11.5, color: "#665f52", marginBottom: 16 }}>
          Can't scan? Enter this key manually: <code style={{ background: "#F3EDE0", padding: "2px 6px", borderRadius: 4 }}>{setupData.secret}</code>
        </div>

        <label style={{ display: "block", marginBottom: 12, maxWidth: 200 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 5, opacity: 0.65 }}>CONFIRMATION CODE</div>
          <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} style={inputStyle} placeholder="000000" />
        </label>

        {error && <div style={{ background: "#F3DCD4", color: "#B8442D", fontSize: 12.5, padding: "8px 12px", borderRadius: 6, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleConfirm} disabled={busy} style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
            {busy ? "Verifying..." : "Confirm & enable"}
          </button>
          <button onClick={() => setSetupData(null)} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#F6E7CC", color: "#8C6414" }}>
          NOT ENABLED
        </span>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Two-factor authentication</div>
      </div>
      <p style={{ fontSize: 13, color: "#665f52", marginBottom: 16 }}>
        Add an extra layer of security to your account using an authenticator app.
      </p>
      <button onClick={handleStart} disabled={busy} style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
        {busy ? "Setting up..." : "Set up two-factor authentication"}
      </button>
    </div>
  );
}
