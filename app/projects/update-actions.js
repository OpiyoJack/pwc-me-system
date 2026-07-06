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
