export default function StatCards({ cards }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}>
      {cards.map((c) => (
        <div key={c.label} style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 10, padding: "14px 16px", borderTop: `3px solid ${c.color || "#1B3A5C"}` }}>
          <div style={{ fontSize: 10.5, color: "#665f52", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 7 }}>{c.label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#241D18" }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
