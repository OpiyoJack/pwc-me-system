"use client";
import { toggleFeedbackStatus } from "./actions";

export default function FeedbackRow({ f, canEdit }) {
  const catColor = (c) => c === "Complaint" ? { bg: "#F3DCD4", fg: "#B8442D" } : c === "Suggestion" ? { bg: "#F6E7CC", fg: "#8C6414" } : { bg: "#E4EBD9", fg: "#5C7A3D" };
  const c = catColor(f.category);

  return (
    <div style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: c.bg, color: c.fg }}>{f.category}</span>
          <span style={{ fontSize: 12, opacity: 0.6 }}>{f.district}</span>
          {f.project && <span style={{ fontSize: 12, opacity: 0.6 }}>· {f.project.name}</span>}
        </div>
        <div style={{ fontSize: 13.5 }}>{f.note}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
          background: f.status === "Open" ? "#F6E7CC" : "#E4EBD9",
          color: f.status === "Open" ? "#8C6414" : "#5C7A3D",
        }}>
          {f.status}
        </span>
        {canEdit && (
          <form action={toggleFeedbackStatus.bind(null, f.id, f.status)}>
            <button type="submit" style={{ background: "none", border: "1px solid #1B3A5C", color: "#1B3A5C", borderRadius: 6, padding: "4px 9px", fontSize: 12, cursor: "pointer" }}>
              {f.status === "Open" ? "Mark resolved" : "Reopen"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
