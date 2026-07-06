"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { logActivity } from "../../lib/activity-log";
import bcrypt from "bcryptjs";

function permsFromFormData(formData) {
  return formData.getAll("permissions").filter(Boolean).join(",");
}

export async function addStaffUser(formData) {
  const session = await auth();
  const name = formData.get("name");
  const phone = formData.get("phone");
  const email = formData.get("email");
  const password = formData.get("password");
  const role = formData.get("role");
  const mustChangePassword = formData.get("mustChangePassword") === "on";
  const permissions = permsFromFormData(formData);

  if (!name || !name.trim() || !email || !email.trim() || !password) return;

  const hashed = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        email: email.trim().toLowerCase(),
        password: hashed,
        role,
        permissions,
        mustChangePassword,
      },
    });
    await logActivity(session?.user?.name, "Created user account", `Created ${email.trim()} with role ${role}`, session?.user?.email);
  } catch (e) {
    console.error("Could not create user (likely duplicate email):", e.message);
    return;
  }

  revalidatePath("/membership");
}

export async function updateStaffUser(id, formData) {
  const session = await auth();
  const name = formData.get("name");
  const phone = formData.get("phone");
  const email = formData.get("email");
  const role = formData.get("role");
  const password = formData.get("password");
  const mustChangePassword = formData.get("mustChangePassword") === "on";
  const permissions = permsFromFormData(formData);

  if (!name || !name.trim() || !email || !email.trim()) return;

  const data = {
    name: name.trim(),
    phone: phone ? phone.trim() : null,
    email: email.trim().toLowerCase(),
    role,
    permissions,
    mustChangePassword,
  };
  if (password && password.trim()) {
    data.password = await bcrypt.hash(password.trim(), 10);
  }

  try {
    await prisma.user.update({ where: { id }, data });
    await logActivity(session?.user?.name, "Updated user account", `Updated ${email.trim()}`, session?.user?.email);
  } catch (e) {
    console.error("Could not update user (likely duplicate email):", e.message);
    return;
  }

  revalidatePath("/membership");
}

export async function toggleUserActive(id, currentActive) {
  const session = await auth();
  const target = await prisma.user.update({ where: { id }, data: { active: !currentActive } });
  await logActivity(
    session?.user?.name,
    !currentActive ? "Reactivated user account" : "Deactivated user account",
    target.email,
    session?.user?.email
  );
  revalidatePath("/membership");
}

export async function deleteStaffUser(id) {
  const session = await auth();
  const target = await prisma.user.findUnique({ where: { id } });
  await prisma.user.delete({ where: { id } });
  await logActivity(session?.user?.name, "Removed user account", target?.email, session?.user?.email);
  revalidatePath("/membership");
}

export async function logLogout() {
  const session = await auth();
  if (session?.user) {
    await logActivity(session.user.name, "Logout", `Logged out from ${session.user.email}`, session.user.email);
  }
}
