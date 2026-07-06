"use client";
import { useState } from "react";
import { updateStaffUser, deleteStaffUser, toggleUserActive } from "./actions";
import { adminResetUserMfa } from "../security/actions";
import { ROLE_DEFINITIONS } from "../../lib/roles";
import { PERMISSION_DEFINITIONS } from "../../lib/permissions";

const ROLE_COLORS = {
  admin: { bg: "#F3DCD4", fg: "#B8442D" },
  coordinator: { bg: "#E4EBD9", fg: "#5C7A3D" },
  meofficer: { bg: "#DDE6EE", fg: "#2E7D8C" },
  donor: { bg: "#F6E7CC", fg: "#8C6414" },
};

export default function UserRow({ u, currentUserId }) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState((u.permissions || "").split(",").filter(Boolean));
  const cellStyle = { padding: "9px 10px", borderBottom: "1px solid #DED2BC", fontSize: 13.5, verticalAlign: "top" };
  const inputStyle = { padding: "6px 8px", borderRadius: 5, border: "1px solid #DED2BC", fontSize: 12.5, width: "100%", boxSizing: "border-box" };
  const isSelf = u.id === currentUserId;
  const roleDef = ROLE_DEFINITIONS[u.role] || { label: u.role, description: "", capabilities: [] };
  const userPerms = (u.permissions || "").split(",").filter(Boolean);

  function togglePermission(key) {
    setPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  async function handleSubmit(formData) {
    permissions.forEach((p) => formData.append("permissions", p));
    setSaving(true);
    await updateStaffUser(u.id, formData);
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Remove ${u.name}'s account entirely? This cannot be undone.`)) return;
    await deleteStaffUser(u.id);
  }

  async function handleToggleActive() {
    const verb = u.active ? "deactivate" : "reactivate";
    if (!confirm(`Are you sure you want to ${verb} ${u.name}'s account?`)) return;
    await toggleUserActive(u.id, u.active);
  }

  async function handleResetMfa() {
    if (!confirm(`Reset two-factor authentication for ${u.name}? They will need to set it up again.`)) return;
    await adminResetUserMfa(u.id);
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={6} style={{ ...cellStyle, background: "#F3EDE0" }}>
          <form action={handleSubmit} style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              <input name="name" defaultValue={u.name} required style={inputStyle} placeholder="Full name" />
              <input name="phone" defaultValue={u.phone || ""} style={inputStyle} placeholder="Phone number" />
              <input name="email" type="email" defaultValue={u.email} required style={inputStyle} placeholder="Email" />
              <select name="role" defaultValue={u.role} style={inputStyle}>
                {Object.entries(ROLE_DEFINITIONS).map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
              </select>
              <input name="password" type="password" style={inputStyle} placeholder="New password (leave blank to keep)" />
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <input name="mustChangePassword" type="checkbox" defaultChecked={u.mustChangePassword} />
                Require password change on next login
              </label>
            </div>

            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#665f52", marginBottom: 6 }}>Additional permissions</div>
              <div style={{ display: "grid", gap: 6 }}>
                {Object.entries(PERMISSION_DEFINITIONS).map(([key, p]) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                    <input type="checkbox" checked={permissions.includes(key)} onChange={() => togglePermission(key)} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
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

  return (
    <>
      <tr>
        <td style={cellStyle}>
          <button onClick={() => setExpanded((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, marginRight: 4 }}>{expanded ? "▾" : "▸"}</button>
          {u.name}{isSelf && <span style={{ fontSize: 11, color: "#665f52" }}> (you)</span>}
        </td>
        <td style={cellStyle}>{u.email}</td>
        <td style={cellStyle}>
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: ROLE_COLORS[u.role]?.bg || "#EDE6D8", color: ROLE_COLORS[u.role]?.fg || "#241D18" }}>
            {roleDef.label}
          </span>
        </td>
        <td style={cellStyle}>
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: u.active ? "#E4EBD9" : "#F3DCD4", color: u.active ? "#5C7A3D" : "#B8442D" }}>
            {u.active ? "Active" : "Deactivated"}
          </span>
        </td>
        <td style={cellStyle}>{new Date(u.createdAt).toISOString().slice(0, 10)}</td>
        <td style={cellStyle}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setEditing(true)} style={{ background: "none", border: "1px solid #1B3A5C", color: "#1B3A5C", borderRadius: 6, padding: "3px 9px", fontSize: 11.5, cursor: "pointer" }}>
              Edit
            </button>
            {!isSelf && (
              <button onClick={handleToggleActive} style={{ background: "none", border: `1px solid ${u.active ? "#8C6414" : "#5C7A3D"}`, color: u.active ? "#8C6414" : "#5C7A3D", borderRadius: 6, padding: "3px 9px", fontSize: 11.5, cursor: "pointer" }}>
                {u.active ? "Deactivate" : "Reactivate"}
              </button>
            )}
            {!isSelf && (
              <button onClick={handleDelete} style={{ background: "none", border: "1px solid #B8442D", color: "#B8442D", borderRadius: 6, padding: "3px 9px", fontSize: 11.5, cursor: "pointer" }}>
                Remove
              </button>
            )}
            {!isSelf && u.mfaEnabled && (
              <button onClick={handleResetMfa} style={{ background: "none", border: "1px solid #8C6414", color: "#8C6414", borderRadius: 6, padding: "3px 9px", fontSize: 11.5, cursor: "pointer" }}>
                Reset MFA
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} style={{ ...cellStyle, background: "#F3EDE0" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>{roleDef.label} — {roleDef.description}</div>
            <ul style={{ margin: "0 0 10px 0", paddingLeft: 18, fontSize: 12, color: "#241D18", lineHeight: 1.7 }}>
              {roleDef.capabilities.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
            {u.phone && <div style={{ fontSize: 12, color: "#665f52", marginBottom: 6 }}>Phone: {u.phone}</div>}
            <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>Extra permissions:</div>
            {userPerms.length === 0 ? (
              <div style={{ fontSize: 12, color: "#665f52" }}>None granted.</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#241D18" }}>
                {userPerms.map((p) => <li key={p}>{PERMISSION_DEFINITIONS[p]?.label || p}</li>)}
              </ul>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
