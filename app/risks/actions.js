"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { logActivity } from "../../lib/activity-log";

export async function addRisk(formData) {
  const title = formData.get("title");
  const description = formData.get("description");
  const likelihood = formData.get("likelihood");
  const impact = formData.get("impact");
  const mitigation = formData.get("mitigation");
  const projectId = formData.get("projectId");

  if (!title || !title.trim()) return;

  await prisma.risk.create({
    data: {
      title: title.trim(),
      description: description || null,
      likelihood, impact,
      mitigation: mitigation || null,
      projectId: projectId ? Number(projectId) : null,
    },
  });

  const session = await auth();
  await logActivity(session?.user?.name, "Logged risk", title.trim(), session?.user?.email);

  revalidatePath("/risks");
  revalidatePath("/");
}

export async function updateRiskStatus(id, status) {
  await prisma.risk.update({ where: { id }, data: { status } });
  revalidatePath("/risks");
  revalidatePath("/");
}

export async function updateRisk(id, formData) {
  const title = formData.get("title");
  const description = formData.get("description");
  const likelihood = formData.get("likelihood");
  const impact = formData.get("impact");
  const mitigation = formData.get("mitigation");
  const projectId = formData.get("projectId");

  if (!title || !title.trim()) return;

  await prisma.risk.update({
    where: { id },
    data: {
      title: title.trim(),
      description: description || null,
      likelihood, impact,
      mitigation: mitigation || null,
      projectId: projectId ? Number(projectId) : null,
    },
  });

  revalidatePath("/risks");
}
