"use server";

import { prisma } from "../../lib/prisma";
import { auth } from "../../auth";
import { generateSecret, generateURI, verify as verifyOtp } from "otplib";
import QRCode from "qrcode";
import { logActivity } from "../../lib/activity-log";

export async function startMfaSetup() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in." };

  const secret = await generateSecret();
  const otpauth = await generateURI({ issuer: "PWC M&E Platform", label: session.user.email, secret });
  const qrDataUrl = await QRCode.toDataURL(otpauth);

  await prisma.user.update({ where: { id: Number(session.user.id) }, data: { mfaSecret: secret } });

  return { secret, qrDataUrl };
}

export async function confirmMfaSetup(token) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in." };

  const user = await prisma.user.findUnique({ where: { id: Number(session.user.id) } });
  if (!user?.mfaSecret) return { error: "No MFA setup in progress. Start over." };

  const result = await verifyOtp({ secret: user.mfaSecret, token: String(token).trim() });
  if (!result.valid) return { error: "That code didn't match. Check your authenticator app and try again." };

  await prisma.user.update({ where: { id: user.id }, data: { mfaEnabled: true } });
  await logActivity(session.user.name, "Enabled MFA", session.user.email, session.user.email);

  return { success: true };
}

export async function disableOwnMfa() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in." };

  await prisma.user.update({ where: { id: Number(session.user.id) }, data: { mfaEnabled: false, mfaSecret: null } });
  await logActivity(session.user.name, "Disabled MFA", session.user.email, session.user.email);

  return { success: true };
}

export async function adminResetUserMfa(targetUserId) {
  const session = await auth();
  if (session?.user?.role !== "admin") return { error: "Only Administrators can reset another user's MFA." };

  const target = await prisma.user.update({ where: { id: Number(targetUserId) }, data: { mfaEnabled: false, mfaSecret: null } });
  await logActivity(session.user.name, "Reset user's MFA", `Reset MFA for ${target.email}`, session.user.email);

  return { success: true };
}
