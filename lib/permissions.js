const PERMISSION_DEFINITIONS = {
  can_import_data: {
    label: "Import Data",
    description: "Upload spreadsheet data into Beneficiaries, Projects & Indicators, Risks, or Feedback.",
  },
  can_manage_staff: {
    label: "Manage Staff & Users",
    description: "Create, edit, deactivate, or remove staff and user accounts, and view the deletion/activity logs.",
  },
  can_delete_projects: {
    label: "Delete Projects",
    description: "Permanently delete a project and its indicators (with a required reason).",
  },
};

function hasPermission(user, key) {
  if (!user) return false;
  if (user.role === "admin") return true; // admins implicitly have every extra permission
  const perms = (user.permissions || "").split(",").map((p) => p.trim()).filter(Boolean);
  return perms.includes(key);
}

module.exports = { PERMISSION_DEFINITIONS, hasPermission };
