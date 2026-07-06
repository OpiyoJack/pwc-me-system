"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { logActivity } from "../../lib/activity-log";

export async function addProject(formData) {
  const name = formData.get("name");
  const sector = formData.get("sector");
  const district = formData.get("district");
  const status = formData.get("status") || "Ongoing";
  const budget = formData.get("budget");
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  const indicatorsJson = formData.get("indicatorsJson");
  const coordinatorId = formData.get("coordinatorId");
  const donorContactId = formData.get("donorContactId");

  if (!name || !name.trim() || !district || !district.trim()) return;
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) return;

  let indicators = [];
  try {
    indicators = JSON.parse(indicatorsJson || "[]");
  } catch {
    indicators = [];
  }

  const validIndicators = indicators
    .filter((i) => i.name && i.name.trim() && i.unit && i.unit.trim())
    .map((i) => ({
      name: i.name.trim(),
      target: Number(i.target) || 0,
      actual: Number(i.actual) || 0,
      unit: i.unit.trim(),
    }));

  await prisma.project.create({
    data: {
      name: name.trim(),
      sector,
      district: district.trim(),
      status,
      budget: budget ? Number(budget) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      coordinatorId: coordinatorId ? Number(coordinatorId) : null,
      donorContactId: donorContactId ? Number(donorContactId) : null,
      indicators: { create: validIndicators },
    },
  });

  const session = await auth();
  await logActivity(session?.user?.name, "Created project", name.trim(), session?.user?.email);

  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function updateProjectAssignments(id, formData) {
  const coordinatorId = formData.get("coordinatorId");
  const donorContactId = formData.get("donorContactId");
  const status = formData.get("status");
  const budget = formData.get("budget");
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");

  if (startDate && endDate && new Date(endDate) < new Date(startDate)) return;

  await prisma.project.update({
    where: { id },
    data: {
      coordinatorId: coordinatorId ? Number(coordinatorId) : null,
      donorContactId: donorContactId ? Number(donorContactId) : null,
      status,
      budget: budget ? Number(budget) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/analytics");
  revalidatePath(`/projects/${id}`);
}

export async function deleteProject(id, reason) {
  const { auth } = await import("../../auth");
  const { hasPermission } = await import("../../lib/permissions");
  const session = await auth();
  const canDelete = session?.user?.role === "admin" || hasPermission(session?.user, "can_delete_projects");
  if (!canDelete) {
    throw new Error("You don't have permission to delete projects.");
  }
  if (!reason || !reason.trim()) {
    throw new Error("A reason is required to delete a project.");
  }

  const projectId = Number(id);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found.");

  await prisma.$transaction([
    // Indicators cannot exist without a project, so they (and their update
    // history) are deleted along with it.
    prisma.indicatorUpdate.deleteMany({ where: { indicator: { projectId } } }),
    prisma.indicator.deleteMany({ where: { projectId } }),
    // These are independent records (real people, real logged risks/feedback)
    // — unlink rather than delete, so no underlying data is lost.
    prisma.beneficiary.updateMany({ where: { projectId }, data: { projectId: null } }),
    prisma.member.updateMany({ where: { projectId }, data: { projectId: null } }),
    prisma.risk.updateMany({ where: { projectId }, data: { projectId: null } }),
    prisma.feedback.updateMany({ where: { projectId }, data: { projectId: null } }),
    prisma.reportRequest.updateMany({ where: { projectId }, data: { projectId: null } }),
    prisma.project.delete({ where: { id: projectId } }),
    prisma.deletionLog.create({
      data: {
        entityType: "Project",
        entityName: project.name,
        reason: reason.trim(),
        deletedBy: session.user.name || session.user.email || "Unknown",
      },
    }),
  ]);

  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/analytics");
  revalidatePath("/beneficiaries");
  revalidatePath("/risks");
  revalidatePath("/feedback");
  revalidatePath("/admin/deletion-log");
}
