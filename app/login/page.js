"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { checkCredentials } from "./actions";

const BEAD_COLORS = ["#B8442D", "#FFFFFF", "#1B3A5C", "#D9A441"];

function BeadRow() {
  return (
    <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden", width: "100%" }}>
      {Array.from({ length: 32 }).map((_, i) => (
        <div key={i} style={{ flex: 1, background: BEAD_COLORS[i % BEAD_COLORS.length] }} />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    padding: "13px 14px",
    borderRadius: 8,
    border: "1px solid #DED2BC",
    fontSize: 15,
    width: "100%",
    boxSizing: "border-box",
    background: "#fff",
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!needsMfa) {
      // Step 1: verify email/password and find out if MFA is required,
      // without creating a session yet.
      const check = await checkCredentials(email, password);
      if (!check.ok) {
        setError(check.error);
        setLoading(false);
        return;
      }
      if (check.mfaEnabled) {
        setNeedsMfa(true);
        setLoading(false);
        return;
      }
      // No MFA — sign in directly.
      const res = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);
      if (res?.error) {
        setError("Incorrect email or password.");
      } else {
        router.push("/");
        router.refresh();
      }
      return;
    }

    // Step 2: credentials already verified above — only the code is being checked now.
    const res = await signIn("credentials", { email, password, token: mfaToken, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Incorrect authentication code.");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: 24,
        background: "linear-gradient(160deg, #B8442D 0%, #1B3A5C 55%, #12283F 100%)",
      }}
    >
      <div style={{ width: 540, maxWidth: "100%" }}>
        <div
          style={{
            background: "#FBF8F2",
            border: "1px solid #DED2BC",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          }}
        >
          <BeadRow />
          <div style={{ padding: "40px 44px 36px" }}>
            <img
              src="/pwc-logo.png"
              alt="PWC logo"
              style={{ width: 56, height: 56, objectFit: "contain", marginBottom: 16 }}
            />
            <div style={{ fontWeight: 700, fontSize: 25, marginBottom: 4, color: "#241D18" }}>
              PWC M&E Platform
            </div>
            <div style={{ fontSize: 13.5, color: "#665f52", marginBottom: 30 }}>
              {needsMfa
                ? "Enter the 6-digit code from your authenticator app."
                : "Cloud-based Monitoring & Evaluation system for Pastoral Women's Council"}
            </div>

            <form onSubmit={handleSubmit}>
              {!needsMfa ? (
                <>
                  <label style={{ display: "block", marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, opacity: 0.65, letterSpacing: "0.03em" }}>
                      EMAIL
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={inputStyle}
                      placeholder="you@pwc.org"
                    />
                  </label>
                  <label style={{ display: "block", marginBottom: 22 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, opacity: 0.65, letterSpacing: "0.03em" }}>
                      PASSWORD
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={inputStyle}
                      placeholder="••••••••"
                    />
                  </label>
                </>
              ) : (
                <label style={{ display: "block", marginBottom: 22 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, opacity: 0.65, letterSpacing: "0.03em" }}>
                    AUTHENTICATION CODE
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={mfaToken}
                    onChange={(e) => setMfaToken(e.target.value)}
                    required
                    style={{ ...inputStyle, letterSpacing: "0.3em", textAlign: "center", fontSize: 20 }}
                    placeholder="000000"
                    maxLength={6}
                  />
                </label>
              )}

              {error && (
                <div style={{ color: "#B8442D", fontSize: 13.5, marginBottom: 16, fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: "#1B3A5C",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "13px 16px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Verifying..." : needsMfa ? "Verify & sign in" : "Sign in"}
              </button>

              {needsMfa && (
                <button
                  type="button"
                  onClick={() => { setNeedsMfa(false); setMfaToken(""); setError(""); }}
                  style={{ width: "100%", background: "none", border: "none", color: "#665f52", fontSize: 12.5, marginTop: 12, cursor: "pointer" }}
                >
                  ← Back
                </button>
              )}
            </form>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: "rgba(243,238,227,0.6)", marginTop: 18 }}>
          © 2026 Pastoral Women's Council. All rights reserved.
        </div>
      </div>
    </main>
  );
}
