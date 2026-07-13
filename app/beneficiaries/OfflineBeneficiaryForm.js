"use client";
import { useState, useEffect } from "react";
import { addBeneficiary } from "./actions";
import { queueBeneficiary } from "../../lib/offline-db";
import TZ_DISTRICTS from "../../lib/tanzania-districts";

const SECTORS = [
  { id: "education", label: "Education" },
  { id: "economic", label: "Women's Economic Empowerment" },
  { id: "rights", label: "Rights & Leadership" },
  { id: "health", label: "Health" },
  { id: "water", label: "Water" },
  { id: "climate", label: "Climate Change" },
];

const inputStyle = { padding: "7px 9px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13.5, width: "100%", boxSizing: "border-box" };

export default function OfflineBeneficiaryForm({ projects, onQueued }) {
  const [isOnline, setIsOnline] = useState(true);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus("");

    const form = e.target;
    const record = {
      name: form.name.value,
      phone: form.phone.value,
      sex: form.sex.value,
      age: form.age.value,
      district: form.district.value,
      sector: form.sector.value,
      projectId: form.projectId.value,
    };

    if (navigator.onLine) {
      try {
        const fd = new FormData();
        Object.entries(record).forEach(([k, v]) => fd.set(k, v));
        await addBeneficiary(fd);
        setStatus("✓ Saved.");
        form.reset();
      } catch (err) {
        // Network dropped mid-submit — fall back to the offline queue instead of losing the entry
        await queueBeneficiary(record);
        setStatus("⚠ Connection lost — saved offline, will sync automatically.");
        form.reset();
        onQueued?.();
      }
    } else {
      await queueBeneficiary(record);
      setStatus("📴 Saved offline — will sync automatically once you're back online.");
      form.reset();
      onQueued?.();
    }

    setSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="form-grid"
      style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 18, marginBottom: 20 }}
    >
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Add beneficiary</div>
        {!isOnline && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "#F6E7CC", color: "#8C6414" }}>
            📴 Offline — entries will be saved locally
          </span>
        )}
      </div>
      <input name="name" placeholder="Full name" required style={inputStyle} />
      <input name="phone" placeholder="Phone number" style={inputStyle} />
      <select name="sex" style={inputStyle} defaultValue="Female">
        <option>Female</option>
        <option>Male</option>
      </select>
      <input name="age" type="number" placeholder="Age" style={inputStyle} />
      <select name="district" style={inputStyle} defaultValue="">
        <option value="">Select district</option>
        {TZ_DISTRICTS.map((r) => (
          <optgroup key={r.region} label={r.region}>
            {r.districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </optgroup>
        ))}
      </select>
      <select name="sector" style={inputStyle} defaultValue="education">
        {SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <select name="projectId" style={{ ...inputStyle, gridColumn: "1 / -1" }} defaultValue="">
        <option value="">No specific project (optional)</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.district}</option>)}
      </select>
      <button
        type="submit"
        disabled={submitting}
        style={{ background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
      >
        {submitting ? "Saving..." : "Save record"}
      </button>
      {status && <div style={{ gridColumn: "1 / -1", fontSize: 12.5, color: "#5C7A3D", fontWeight: 600 }}>{status}</div>}
    </form>
  );
}
