"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { logActivity } from "../../lib/activity-log";

export async function updateIndicatorActual(indicatorId, formData) {
  const newActual = Number(formData.get("newActual"));
  const note = formData.get("note");

  if (isNaN(newActual)) return;

  await prisma.$transaction([
    prisma.indicator.update({
      where: { id: indicatorId },
      data: { actual: newActual },
    }),
    prisma.indicatorUpdate.create({
      data: { indicatorId, newActual, note: note || null },
    }),
  ]);

  const session = await auth();
  await logActivity(session?.user?.name, "Updated indicator progress", `Indicator #${indicatorId} → ${newActual}`, session?.user?.email);

  revalidatePath("/projects");
  revalidatePath("/");
}


export async function updateIndicatorDetails(indicatorId, projectId, formData) {
  const name = formData.get("name");
  const target = formData.get("target");
  const unit = formData.get("unit");

  if (!name || !name.trim() || !unit || !unit.trim()) return;

  await prisma.indicator.update({
    where: { id: Number(indicatorId) },
    data: { name: name.trim(), target: Number(target) || 0, unit: unit.trim() },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}
