"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { changeOwnPassword } from "./actions";

export default function ChangePasswordPage() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const inputStyle = { padding: "10px 12px", borderRadius: 6, border: "1px solid #DED2BC", fontSize: 14, width: "100%", boxSizing: "border-box" };

  async function handleSubmit(formData) {
    setSubmitting(true);
    const res = await changeOwnPassword(formData);
    if (res.error) {
      setError(res.error);
      setSubmitting(false);
    } else {
      setDone(true);
      // The session token still reflects the old "must change password" flag
      // until a fresh login happens, so we sign out and send the user back
      // to the login page to sign in again with their new password.
      setTimeout(() => signOut({ callbackUrl: "/login" }), 1200);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 20 }}>
      <form action={handleSubmit} style={{ background: "#FBF8F2", border: "1px solid #DED2BC", borderRadius: 12, padding: 28, width: 380, maxWidth: "100%" }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Set a new password</div>
        <div style={{ fontSize: 12.5, color: "#665f52", marginBottom: 20 }}>
          Your administrator requires you to set a new password before continuing.
        </div>

        {done ? (
          <div style={{ background: "#E4EBD9", color: "#5C7A3D", fontSize: 13.5, padding: "10px 14px", borderRadius: 6 }}>
            Password updated. Redirecting you to sign in again...
          </div>
        ) : (
          <>
            <label style={{ display: "block", marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 5, opacity: 0.65 }}>NEW PASSWORD</div>
              <input name="newPassword" type="password" required style={inputStyle} />
            </label>
            <label style={{ display: "block", marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 5, opacity: 0.65 }}>CONFIRM PASSWORD</div>
              <input name="confirmPassword" type="password" required style={inputStyle} />
            </label>

            {error && <div style={{ color: "#B8442D", fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <button type="submit" disabled={submitting} style={{ width: "100%", background: "#1B3A5C", color: "#fff", border: "none", borderRadius: 6, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {submitting ? "Saving..." : "Set password & continue"}
            </button>
          </>
        )}
      </form>
    </main>
  );
}
