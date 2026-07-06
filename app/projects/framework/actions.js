"use server";

import { prisma } from "../../../lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import { logActivity } from "../../../lib/activity-log";

export async function addFrameworkNode(projectId, parentId, formData) {
  const levelLabel = formData.get("levelLabel");
  const title = formData.get("title");
  const description = formData.get("description");

  if (!levelLabel || !levelLabel.trim() || !title || !title.trim()) return;

  const siblingCount = await prisma.frameworkNode.count({
    where: { projectId: Number(projectId), parentId: parentId ? Number(parentId) : null },
  });

  await prisma.frameworkNode.create({
    data: {
      projectId: Number(projectId),
      parentId: parentId ? Number(parentId) : null,
      levelLabel: levelLabel.trim(),
      title: title.trim(),
      description: description ? description.trim() : null,
      order: siblingCount,
    },
  });

  const session = await auth();
  await logActivity(session?.user?.name, "Added results framework node", `${levelLabel.trim()}: ${title.trim()}`, session?.user?.email);

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteFrameworkNode(id, projectId) {
  const childCount = await prisma.frameworkNode.count({ where: { parentId: id } });
  const indicatorCount = await prisma.indicator.count({ where: { frameworkNodeId: id } });

  if (childCount > 0) {
    return { error: "This level has child levels under it. Remove or reassign those first." };
  }

  // Indicators linked to this node are unlinked, not deleted — they simply
  // become "unassigned" in the framework rather than losing their data.
  await prisma.indicator.updateMany({ where: { frameworkNodeId: id }, data: { frameworkNodeId: null } });
  await prisma.frameworkNode.delete({ where: { id } });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function assignIndicatorToNode(indicatorId, nodeId) {
  await prisma.indicator.update({
    where: { id: Number(indicatorId) },
    data: { frameworkNodeId: nodeId ? Number(nodeId) : null },
  });
  revalidatePath("/projects");
}

export async function addIndicatorToNode(projectId, nodeId, formData) {
  const name = formData.get("name");
  const target = formData.get("target");
  const unit = formData.get("unit");

  if (!name || !name.trim() || !unit || !unit.trim()) return;

  await prisma.indicator.create({
    data: {
      projectId: Number(projectId),
      frameworkNodeId: nodeId ? Number(nodeId) : null,
      name: name.trim(),
      target: Number(target) || 0,
      actual: 0,
      unit: unit.trim(),
    },
  });

  const session = await auth();
  await logActivity(session?.user?.name, "Added indicator", name.trim(), session?.user?.email);

  revalidatePath(`/projects/${projectId}`);
}
