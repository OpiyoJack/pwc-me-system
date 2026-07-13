export default function OfflinePage() {
  return (
    <main style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 12, fontFamily: "sans-serif", padding: 24, textAlign: "center",
      background: "#EDE6D8",
    }}>
      <img src="/pwc-logo.png" alt="PWC logo" style={{ width: 64, height: 64, objectFit: "contain" }} />
      <div style={{ fontSize: 20, fontWeight: 700, color: "#241D18" }}>You're offline</div>
      <div style={{ fontSize: 14, color: "#665f52", maxWidth: 380 }}>
        This page hasn't been loaded before, so it isn't available offline yet. Pages you've already
        visited will still work — and if you were adding a beneficiary, don't worry: any offline entries
        are saved locally and will sync automatically once you're back online.
      </div>
    </main>
  );
}
