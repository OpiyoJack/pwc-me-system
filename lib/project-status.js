// Status is auto-derived from start/end dates. "On Hold" and "Terminated"
// are manual designations that always override the date-based calculation,
// since no date range can tell you a project was paused or cancelled.
function getEffectiveStatus(project) {
  if (project.status === "On Hold" || project.status === "Terminated") {
    return project.status;
  }

  const today = new Date();
  const start = project.startDate ? new Date(project.startDate) : null;
  const end = project.endDate ? new Date(project.endDate) : null;

  if (start && today < start) return "Planned";
  if (end && today > end) return "Completed";
  if (start || end) return "Ongoing";

  // No dates set at all: fall back to whatever was manually chosen.
  return project.status || "Ongoing";
}

module.exports = { getEffectiveStatus };
