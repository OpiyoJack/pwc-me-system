// Field definitions per importable entity, with common header synonyms used
// by Excel exports, KOBO Collect, SurveyMonkey, and Google/MS Forms — so we
// can auto-suggest a mapping instead of making the user do it all by hand.
const IMPORT_TARGETS = {
  beneficiaries: {
    label: "Beneficiaries",
    fields: [
      { key: "name", label: "Full name", required: true, synonyms: ["name", "fullname", "beneficiaryname", "respondentname", "clientname"], example: "Naserian Kimani" },
      { key: "phone", label: "Phone number", required: false, synonyms: ["phone", "phonenumber", "mobile", "contact", "telephone", "cellphone"], example: "0754123456" },
      { key: "sex", label: "Sex", required: false, synonyms: ["sex", "gender"], example: "Female" },
      { key: "age", label: "Age", required: false, synonyms: ["age", "yearsold"], example: "29" },
      { key: "district", label: "District", required: false, synonyms: ["district", "location", "region"], example: "Longido" },
      { key: "sector", label: "Sector", required: false, synonyms: ["sector", "programme", "program", "category"], example: "economic" },
      { key: "project", label: "Project (match by name)", required: false, synonyms: ["project", "projectname", "programmename"], example: "VICOBA Microcredit Expansion Programme" },
      { key: "enrolled", label: "Enrollment date", required: false, synonyms: ["date", "enrolled", "enrollmentdate", "dateregistered", "submissiondate", "today"], example: "2026-06-15" },
    ],
    notes: "Sector must be one of: education, economic, rights, health, water, climate. Project must match an existing project name exactly, or leave blank.",
  },
  projects_indicators: {
    label: "Projects & Indicators",
    fields: [
      { key: "projectName", label: "Project name", required: true, synonyms: ["project", "projectname", "name"], example: "Borehole Construction & Water Access Programme" },
      { key: "sector", label: "Sector", required: true, synonyms: ["sector", "programme", "program"], example: "water" },
      { key: "district", label: "District", required: true, synonyms: ["district", "location", "region"], example: "Longido" },
      { key: "indicatorName", label: "Indicator name", required: true, synonyms: ["indicator", "indicatorname", "metric"], example: "Households with reliable water access" },
      { key: "target", label: "Target", required: true, synonyms: ["target", "targetvalue"], example: "400" },
      { key: "actual", label: "Actual (optional)", required: false, synonyms: ["actual", "actualvalue", "achieved"], example: "0" },
      { key: "unit", label: "Unit", required: true, synonyms: ["unit", "uom", "measure"], example: "households" },
    ],
    notes: "Sector must be one of: education, economic, rights, health, water, climate. One row = one indicator; repeat the project name on multiple rows to add several indicators to the same project. If the project name already exists, the indicator is added to it; otherwise a new project is created.",
  },
  risks: {
    label: "Risk Register",
    fields: [
      { key: "title", label: "Risk title", required: true, synonyms: ["title", "risk", "riskname", "name"], example: "Drought reducing water point yield" },
      { key: "description", label: "Description", required: false, synonyms: ["description", "details", "notes"], example: "Prolonged dry season may reduce output below target." },
      { key: "likelihood", label: "Likelihood", required: false, synonyms: ["likelihood", "probability"], example: "High" },
      { key: "impact", label: "Impact", required: false, synonyms: ["impact", "severity"], example: "High" },
      { key: "mitigation", label: "Mitigation plan", required: false, synonyms: ["mitigation", "response", "action"], example: "Explore solar-powered pumping as backup." },
      { key: "status", label: "Status", required: false, synonyms: ["status"], example: "Open" },
      { key: "project", label: "Project (match by name)", required: false, synonyms: ["project", "projectname"], example: "Borehole Construction & Water Access Programme" },
    ],
    notes: "Likelihood/Impact must be one of: Low, Medium, High. Status must be one of: Open, Mitigated, Closed. Project must match an existing project name exactly, or leave blank.",
  },
  indicator_updates: {
    label: "Indicator Progress Update",
    fields: [
      { key: "indicatorId", label: "Indicator ID", required: true, synonyms: ["indicatorid", "id"], example: "3" },
      { key: "indicatorName", label: "Indicator name (reference only)", required: false, synonyms: ["indicatorname", "indicator", "name"], example: "Households with reliable water access" },
      { key: "actual", label: "New actual value", required: true, synonyms: ["actual", "actualvalue", "newactual"], example: "310" },
    ],
    notes: "Only Indicator ID and New actual value are used — Indicator ID must match an existing indicator exactly (download the pre-filled template so IDs are correct).",
  },
  feedback: {
    label: "Feedback & Accountability",
    fields: [
      { key: "category", label: "Category", required: true, synonyms: ["category", "type"], example: "Complaint" },
      { key: "district", label: "District", required: true, synonyms: ["district", "location", "region"], example: "Longido" },
      { key: "note", label: "Note / details", required: true, synonyms: ["note", "details", "description", "comment"], example: "Water point pump making unusual noise." },
      { key: "status", label: "Status", required: false, synonyms: ["status"], example: "Open" },
      { key: "project", label: "Project (match by name)", required: false, synonyms: ["project", "projectname"], example: "Borehole Construction & Water Access Programme" },
    ],
    notes: "Category must be one of: Feedback, Suggestion, Complaint. Status must be one of: Open, Resolved (defaults to Open). Project must match an existing project name exactly, or leave blank.",
  },
};

function normalize(str) {
  return String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function suggestMapping(targetKey, headers) {
  const target = IMPORT_TARGETS[targetKey];
  const mapping = {};
  const normalizedHeaders = headers.map((h) => ({ original: h, normalized: normalize(h) }));

  target.fields.forEach((field) => {
    const match = normalizedHeaders.find((h) => field.synonyms.some((syn) => h.normalized === normalize(syn) || h.normalized.includes(normalize(syn))));
    mapping[field.key] = match ? match.original : "";
  });

  return mapping;
}

module.exports = { IMPORT_TARGETS, suggestMapping };
