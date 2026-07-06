"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { logActivity } from "../../lib/activity-log";

export async function addFeedback(formData) {
  const category = formData.get("category");
  const district = formData.get("district");
  const note = formData.get("note");
  const projectId = formData.get("projectId");

  if (!note || !note.trim()) return;

  await prisma.feedback.create({
    data: {
      category, district, note, status: "Open",
      projectId: projectId ? Number(projectId) : null,
    },
  });

  const session = await auth();
  await logActivity(session?.user?.name, "Logged feedback", `${category}: ${note.slice(0, 60)}`, session?.user?.email);

  revalidatePath("/feedback");
}

export async function toggleFeedbackStatus(id, currentStatus) {
  await prisma.feedback.update({
    where: { id },
    data: { status: currentStatus === "Open" ? "Resolved" : "Open" },
  });
  revalidatePath("/feedback");
}
