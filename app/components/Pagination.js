import Link from "next/link";

export default function Pagination({ page, totalPages, buildHref }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const windowSize = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= windowSize) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  const baseBtn = {
    fontSize: 12.5, padding: "6px 11px", borderRadius: 6, textDecoration: "none",
    border: "1px solid #DED2BC", color: "#241D18", minWidth: 34, textAlign: "center",
  };

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 18, alignItems: "center", flexWrap: "wrap" }}>
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        style={{ ...baseBtn, opacity: page === 1 ? 0.4 : 1, pointerEvents: page === 1 ? "none" : "auto" }}
      >
        ← Prev
      </Link>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} style={{ fontSize: 12.5, color: "#665f52", padding: "0 4px" }}>…</span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            style={{
              ...baseBtn,
              background: p === page ? "#1B3A5C" : "#FBF8F2",
              color: p === page ? "#fff" : "#241D18",
              border: `1px solid ${p === page ? "#1B3A5C" : "#DED2BC"}`,
              fontWeight: p === page ? 700 : 500,
            }}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        style={{ ...baseBtn, opacity: page === totalPages ? 0.4 : 1, pointerEvents: page === totalPages ? "none" : "auto" }}
      >
        Next →
      </Link>
    </div>
  );
}
