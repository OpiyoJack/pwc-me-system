"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "./actions";

const REASONS = [
  "Project completed and no longer needed in system",
  "Project cancelled / never started",
  "Duplicate entry",
  "Created in error",
  "Merged into another project",
  "Other (specify below)",
];

export default function DeleteProjectButton({ projectId, projectName, redirectAfter }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    const finalReason = reason === "Other (specify below)" ? customReason.trim() : reason;
    if (!finalReason) {
      setError("Please provide a reason.");
      return;
    }
    setError("");
    setDeleting(true);
    try {
      await deleteProject(projectId, finalReason);
      if (redirectAfter) router.push(redirectAfter);
    } catch (e) {
      setError(e.message || "Could not delete this project.");
      setDeleting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ background: "none", border: "1px solid #B8442D", color: "#B8442D", borderRadius: 6, padding: "2px 8px", fontSize: 11.5, cursor: "pointer" }}
      >
        Delete project
      </button>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(18,14,10,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }} onClick={() => !deleting && setOpen(false)}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#FBF8F2", borderRadius: 12, padding: 22, width: 420, maxWidth: "100%", border: "1px solid #DED2BC" }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: "#B8442D" }}>Delete "{projectName}"?</div>
        <div style={{ fontSize: 12.5, color: "#665f52", marginBottom: 16 }}>
          This permanently removes the project and its indicators. Linked beneficiaries, members, risks, and feedback are kept but unlinked. This cannot be undone.
        </div>

        <label style={{ fontSize: 11.5, fontWeight: 700, display: "block", marginBottom: 5 }}>Reason for deletion</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13, width: "100%", boxSizing: "border-box", marginBottom: 10 }}
        >
          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        {reason === "Other (specify below)" && (
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Please specify the reason"
            style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 13, width: "100%", boxSizing: "border-box", minHeight: 60, marginBottom: 10 }}
          />
        )}

        {error && <div style={{ background: "#F3DCD4", color: "#B8442D", fontSize: 12.5, padding: "8px 12px", borderRadius: 6, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            style={{ background: "#B8442D", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer" }}
          >
            {deleting ? "Deleting..." : "Confirm deletion"}
          </button>
          <button
            onClick={() => setOpen(false)}
            disabled={deleting}
            style={{ background: "none", border: "1px solid #DED2BC", borderRadius: 6, padding: "9px 16px", fontSize: 13.5, cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
