"use server";

import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";

export async function checkCredentials(email, password) {
  if (!email || !password) return { ok: false, error: "Email and password are required." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: false, error: "Incorrect email or password." };
  if (!user.active) return { ok: false, error: "This account has been deactivated. Contact your Administrator." };

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return { ok: false, error: "Incorrect email or password." };

  return { ok: true, mfaEnabled: user.mfaEnabled };
}
