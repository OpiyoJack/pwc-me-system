const ROLE_DEFINITIONS = {
  admin: {
    label: "Administrator",
    description: "Full system access.",
    capabilities: [
      "Create, edit, and delete projects, indicators, and all records",
      "Manage staff & user accounts, including roles and account status",
      "View and manage all reports across every project, without restriction",
      "Access the deletion log and other administrative tools",
    ],
  },
  coordinator: {
    label: "Coordinator",
    description: "Day-to-day project and field data management.",
    capabilities: [
      "Create and update projects, indicators, beneficiaries, risks, and feedback",
      "Update indicator progress and manage project assignments",
      "Import data and request/view reports across all projects",
      "Cannot manage staff accounts or access the deletion log",
    ],
  },
  meofficer: {
    label: "M&E Officer",
    description: "Monitoring, evaluation, and reporting focus.",
    capabilities: [
      "Update indicator progress and manage the risk register",
      "Log and resolve feedback, and import monitoring data",
      "Request and view reports across all projects",
      "Cannot manage staff accounts or access the deletion log",
    ],
  },
  donor: {
    label: "Donor / Partner",
    description: "View-only access scoped to their own project(s).",
    capabilities: [
      "View progress, beneficiaries, risks, and feedback for their assigned project(s) only",
      "Request and view reports scoped only to their assigned project(s)",
      "Cannot add, edit, or delete any records",
    ],
  },
};

module.exports = { ROLE_DEFINITIONS };
