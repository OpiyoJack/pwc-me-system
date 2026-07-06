"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "../../lib/activity-log";

export async function requestReport(formData) {
  const reportType = formData.get("reportType") || "programme_summary";
  const reportName = formData.get("reportName") || "PWC M&E Results Report";
  const reportDescription = formData.get("reportDescription") || "";
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  const projectId = formData.get("projectId");
  const requestedByName = formData.get("requestedByName") || "Unknown user";
  const requestedById = formData.get("requestedById");

  if (startDate && endDate && new Date(endDate) < new Date(startDate)) return;

  let projectName = null;
  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: Number(projectId) } });
    projectName = project ? project.name : null;
  }

  await prisma.reportRequest.create({
    data: {
      reportType,
      name: reportName,
      description: reportDescription,
      requestedByName,
      requestedById: requestedById ? Number(requestedById) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate + "T23:59:59") : null,
      projectId: projectId ? Number(projectId) : null,
      projectName,
      status: "Processing",
    },
  });

  await logActivity(requestedByName, "Requested report", reportName);

  revalidatePath("/reports");
}

// Called periodically from the client to "complete" any requests that have
// been processing for a few seconds — simulating queued background work
// since there's no separate job worker process in this deployment.
export async function advanceReportQueue() {
  const cutoff = new Date(Date.now() - 2500);
  await prisma.reportRequest.updateMany({
    where: { status: "Processing", createdAt: { lte: cutoff } },
    data: { status: "Finished", finishedAt: new Date() },
  });

  revalidatePath("/reports");
}
