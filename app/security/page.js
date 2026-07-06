import { prisma } from "../../lib/prisma";
import { auth } from "../../auth";
import MfaSetupPanel from "./MfaSetupPanel";

export default async function SecurityPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: Number(session.user.id) } });

  return (
    <main style={{ margin: "0", padding: "40px 32px", maxWidth: 700, boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Security</h1>
      <p style={{ color: "#665f52", fontSize: 13.5, marginBottom: 24 }}>
        Manage two-factor authentication for your account.
      </p>

      <MfaSetupPanel mfaEnabled={user.mfaEnabled} />
    </main>
  );
}
