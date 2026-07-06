"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { logActivity } from "../../lib/activity-log";

export async function addBeneficiary(formData) {
  const name = formData.get("name");
  const phone = formData.get("phone");
  const sex = formData.get("sex");
  const age = Number(formData.get("age"));
  const district = formData.get("district");
  const sector = formData.get("sector");
  const projectId = formData.get("projectId");

  if (!name || !name.trim()) return;

  await prisma.beneficiary.create({
    data: {
      name, sex, age, district, sector,
      phone: phone || null,
      projectId: projectId ? Number(projectId) : null,
    },
  });

  const session = await auth();
  await logActivity(session?.user?.name, "Created beneficiary", name, session?.user?.email);

  revalidatePath("/beneficiaries");
}

export async function updateBeneficiary(id, formData) {
  const name = formData.get("name");
  const phone = formData.get("phone");
  const sex = formData.get("sex");
  const age = Number(formData.get("age"));
  const district = formData.get("district");
  const sector = formData.get("sector");
  const projectId = formData.get("projectId");

  if (!name || !name.trim()) return;

  await prisma.beneficiary.update({
    where: { id },
    data: {
      name, sex, age, district, sector,
      phone: phone || null,
      projectId: projectId ? Number(projectId) : null,
    },
  });

  revalidatePath("/beneficiaries");
}
