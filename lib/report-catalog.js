const REPORT_CATALOG = [
  {
    id: "programme_summary",
    category: "Common",
    name: "Programme Summary Report",
    description: "A comprehensive overview combining projects, indicators, beneficiaries, and feedback for the selected period and scope.",
  },
  {
    id: "projects_indicators",
    category: "Projects & Indicators",
    name: "Projects & Indicators Report",
    description: "All projects with sector, district, status, coordinator, donor contact, and indicator progress against targets.",
  },
  {
    id: "beneficiaries",
    category: "Beneficiaries",
    name: "Beneficiary Register Report",
    description: "A line list of registered beneficiaries with demographic details, district, sector, and linked project.",
  },
  {
    id: "risks",
    category: "Risk Register",
    name: "Risk Register Report",
    description: "All logged risks with likelihood, impact, mitigation plans, status, and linked project.",
  },
  {
    id: "feedback",
    category: "Feedback & Accountability",
    name: "Feedback & Complaints Report",
    description: "Community feedback, suggestions, and complaints with category, status, and linked project.",
  },
];

const REPORT_CATEGORIES = [...new Set(REPORT_CATALOG.map((r) => r.category))];

function getReportById(id) {
  return REPORT_CATALOG.find((r) => r.id === id) || null;
}

module.exports = { REPORT_CATALOG, REPORT_CATEGORIES, getReportById };
