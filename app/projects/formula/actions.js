"use server";

const { prisma } = require("../../../lib/prisma");
const { recalculateIndicator } = require("../../../lib/formula-engine");
import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import { logActivity } from "../../../lib/activity-log";

export async function setIndicatorFormula(indicatorId, projectId, formData) {
  const field = formData.get("field");
  const operator = formData.get("operator");
  const value = formData.get("value");

  if (operator !== "count_all" && (!value || !value.trim())) {
    return { error: "Please enter a value to compare against for this formula type." };
  }

  await prisma.indicatorFormula.upsert({
    where: { indicatorId: Number(indicatorId) },
    update: { field, operator, value: value || null },
    create: { indicatorId: Number(indicatorId), field, operator, value: value || null },
  });

  await recalculateIndicator(Number(indicatorId));

  const session = await auth();
  await logActivity(session?.user?.name, "Set indicator formula", `Indicator #${indicatorId}: ${field} / ${operator}`, session?.user?.email);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}

export async function removeIndicatorFormula(indicatorId, projectId) {
  await prisma.indicatorFormula.deleteMany({ where: { indicatorId: Number(indicatorId) } });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}

export async function manualRecalculate(indicatorId, projectId) {
  await recalculateIndicator(Number(indicatorId));
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}
