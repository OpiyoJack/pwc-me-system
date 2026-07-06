"use server";

import { prisma } from "../../lib/prisma";
import { auth } from "../../auth";
import bcrypt from "bcryptjs";

export async function changeOwnPassword(formData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in." };

  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (!newPassword || newPassword.length < 6) return { error: "Password must be at least 6 characters." };
  if (newPassword !== confirmPassword) return { error: "Passwords do not match." };

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: { password: hashed, mustChangePassword: false },
  });

  return { success: true };
}
