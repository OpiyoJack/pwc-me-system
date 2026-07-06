const { prisma } = require("./prisma");

// Determines which projects a given session is allowed to see in reports.
// Donors are restricted to only the projects where they are the donor contact.
// Everyone else (admin/coordinator/meofficer) can see all projects, or a
// specific one if requested — as long as it's a project they're allowed to see.
async function resolveReportScope(session, requestedProjectId) {
  const isDonor = session?.user?.role === "donor";
  const userId = session?.user?.id ? Number(session.user.id) : null;

  let allowedProjects;
  if (isDonor) {
    allowedProjects = await prisma.project.findMany({
      where: { donorContactId: userId },
      orderBy: { name: "asc" },
    });
  } else {
    allowedProjects = await prisma.project.findMany({ orderBy: { name: "asc" } });
  }

  const allowedIds = allowedProjects.map((p) => p.id);
  let scopedProjectIds = allowedIds;
  let singleProjectRequested = false;

  if (requestedProjectId && requestedProjectId !== "all") {
    const reqId = Number(requestedProjectId);
    if (allowedIds.includes(reqId)) {
      scopedProjectIds = [reqId];
      singleProjectRequested = true;
    }
    // If a donor requests a project they don't own, silently fall back to
    // their allowed set rather than exposing anything outside their scope.
  }

  return { allowedProjects, scopedProjectIds, isDonor, singleProjectRequested };
}

module.exports = { resolveReportScope };
