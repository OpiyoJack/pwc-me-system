"use client";
import { useState } from "react";
import { addStaffUser } from "./actions";
import { ROLE_DEFINITIONS } from "../../lib/roles";
import { PERMISSION_DEFINITIONS } from "../../lib/permissions";

const STEPS = ["Demographic Info", "Login Info", "Roles Info"];
const inputStyle = { padding: "9px 11px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13.5, width: "100%", boxSizing: "border-box" };

export default function AddUserWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [role, setRole] = useState("coordinator");
  const [permissions, setPermissions] = useState([]);

  function togglePermission(key) {
    setPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  function reset() {
    setStep(0);
    setName(""); setPhone(""); setEmail(""); setPassword(""); setConfirmPassword("");
    setMustChangePassword(true); setRole("coordinator"); setPermissions([]);
    setError("");
  }

  function goNext() {
    setError("");
    if (step === 0 && !name.trim()) { setError("Full name is required."); return; }
    if (step === 1) {
      if (!email.trim()) { setError("Email is required."); return; }
      if (!password || password.length < 6) { setError("Password must be at least 6 characters."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function goBack() {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSave() {
    setSubmitting(true);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("phone", phone);
    formData.set("email", email);
    formData.set("password", password);
    formData.set("role", role);
    if (mustChangePassword) formData.set("mustChangePassword", "on");
    permissions.forEach((p) => formData.append("permissions", p));

    await addStaffUser(formData);
    setSubmitting(false);
    setOpen(false);
    reset();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginBottom: 24 }}
      >
        + Add User
      </button>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(18,14,10,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }} onClick={() => !submitting && setOpen(false)}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#FBF8F2", borderRadius: 12, width: 620, maxWidth: "100%", border: "1px solid #DED2BC", overflow: "hidden", display: "flex", maxHeight: "85vh" }}>

        <div style={{ width: 160, background: "#F3EDE0", padding: "20px 16px", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Add User</div>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontSize: 12, color: i === step ? "#1B3A5C" : "#665f52", fontWeight: i === step ? 700 : 500 }}>
              <span style={{
                width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, flexShrink: 0,
                background: i < step ? "#5C7A3D" : i === step ? "#1B3A5C" : "transparent",
                border: i >= step ? "1px solid #DED2BC" : "none",
                color: i <= step ? "#fff" : "#665f52",
              }}>
                {i < step ? "✓" : i + 1}
              </span>
              {s}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, padding: 22, overflowY: "auto" }}>
          {step === 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Demographic Info</div>
              <label style={{ display: "block", marginBottom: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 5, opacity: 0.65 }}>FULL NAME *</div>
                <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: "block", marginBottom: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 5, opacity: 0.65 }}>PHONE NUMBER</div>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
              </label>
            </div>
          )}

          {step === 1 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Login Info</div>
              <label style={{ display: "block", marginBottom: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 5, opacity: 0.65 }}>EMAIL *</div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: "block", marginBottom: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 5, opacity: 0.65 }}>PASSWORD *</div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: "block", marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 5, opacity: 0.65 }}>CONFIRM PASSWORD *</div>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5 }}>
                <input type="checkbox" checked={mustChangePassword} onChange={(e) => setMustChangePassword(e.target.checked)} style={{ marginTop: 2 }} />
                Require this user to set a new password the first time they log in
              </label>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Roles Info</div>
              <div style={{ fontSize: 12, color: "#665f52", marginBottom: 14 }}>These can be changed anytime after the account is created.</div>

              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", textTransform: "uppercase", marginBottom: 8 }}>Primary role</div>
              <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
                {Object.entries(ROLE_DEFINITIONS).map(([key, r]) => (
                  <label key={key} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, background: role === key ? "#F3EDE0" : "transparent", borderRadius: 6, padding: "6px 8px" }}>
                    <input type="radio" name="role" checked={role === key} onChange={() => setRole(key)} style={{ marginTop: 3 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.label}</div>
                      <div style={{ fontSize: 11.5, color: "#665f52" }}>{r.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", textTransform: "uppercase", marginBottom: 8 }}>Additional permissions</div>
              <div style={{ display: "grid", gap: 8 }}>
                {Object.entries(PERMISSION_DEFINITIONS).map(([key, p]) => (
                  <label key={key} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={permissions.includes(key)} onChange={() => togglePermission(key)} style={{ marginTop: 3 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.label}</div>
                      <div style={{ fontSize: 11.5, color: "#665f52" }}>{p.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#665f52", marginTop: 10, fontStyle: "italic" }}>
                Administrators automatically have all permissions.
              </div>
            </div>
          )}

          {error && <div style={{ background: "#F3DCD4", color: "#B8442D", fontSize: 12.5, padding: "8px 12px", borderRadius: 6, marginTop: 14 }}>{error}</div>}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            {step > 0 && (
              <button onClick={goBack} style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, cursor: "pointer" }}>
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={goNext} style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                Next
              </button>
            ) : (
              <button onClick={handleSave} disabled={submitting} style={{ background: "#5C7A3D", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                {submitting ? "Saving..." : "Save & close"}
              </button>
            )}
            <button onClick={() => { setOpen(false); reset(); }} style={{ background: "none", border: "1px solid #B8442D", color: "#B8442D", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, cursor: "pointer", marginLeft: "auto" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
