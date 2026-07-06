"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { logActivity } from "../../lib/activity-log";

const VALID_SEX = ["Female", "Male"];
const VALID_SECTORS = ["education", "economic", "rights", "health", "water", "climate"];
const VALID_LEVELS = ["Low", "Medium", "High"];
const VALID_RISK_STATUS = ["Open", "Mitigated", "Closed"];
const VALID_FEEDBACK_CATEGORY = ["Feedback", "Suggestion", "Complaint"];
const VALID_FEEDBACK_STATUS = ["Open", "Resolved"];

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// Strict validation for constrained fields: blank is allowed (falls back to
// the default), but a non-blank value that doesn't match one of the valid
// options is rejected rather than silently coerced — this is what stops
// unrelated/garbage spreadsheets from being accepted as valid data.
function strictPick(list, value, fallbackIfBlank) {
  const raw = String(value ?? "").trim();
  if (!raw) return { ok: true, value: fallbackIfBlank };
  const found = list.find((v) => v.toLowerCase() === raw.toLowerCase());
  if (!found) return { ok: false, value: null };
  return { ok: true, value: found };
}

export async function importBeneficiaries(rows, projects) {
  const projectByName = {};
  projects.forEach((p) => { projectByName[p.name.toLowerCase().trim()] = p.id; });

  let created = 0;
  const skipped = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = (row.name || "").toString().trim();
    if (!name) { skipped.push({ row: i + 1, reason: "Missing full name" }); continue; }

    const sexCheck = strictPick(VALID_SEX, row.sex, "Female");
    if (!sexCheck.ok) { skipped.push({ row: i + 1, reason: `Invalid Sex value "${row.sex}" (must be Female or Male)` }); continue; }

    const sectorCheck = strictPick(VALID_SECTORS, row.sector, "education");
    if (!sectorCheck.ok) { skipped.push({ row: i + 1, reason: `Invalid Sector value "${row.sector}" (must be one of: ${VALID_SECTORS.join(", ")})` }); continue; }

    const ageRaw = String(row.age ?? "").trim();
    const age = ageRaw ? parseInt(ageRaw, 10) : 0;
    if (ageRaw && (isNaN(age) || age < 0 || age > 120)) { skipped.push({ row: i + 1, reason: `Invalid Age value "${row.age}"` }); continue; }

    const projectName = (row.project || "").toString().trim();
    if (projectName && !projectByName[projectName.toLowerCase()]) {
      skipped.push({ row: i + 1, reason: `Project "${projectName}" not found` });
      continue;
    }

    try {
      await prisma.beneficiary.create({
        data: {
          name,
          phone: (row.phone || "").toString().trim() || null,
          sex: sexCheck.value,
          age,
          district: (row.district || "").toString().trim() || "Ngorongoro",
          sector: sectorCheck.value,
          projectId: projectName ? projectByName[projectName.toLowerCase()] : null,
          ...(parseDate(row.enrolled) ? { enrolled: parseDate(row.enrolled) } : {}),
        },
      });
      created++;
    } catch { skipped.push({ row: i + 1, reason: "Could not save record" }); }
  }
  revalidatePath("/beneficiaries");
  revalidatePath("/");
  return { created, skipped, total: rows.length };
}

export async function importProjectsIndicators(rows) {
  let created = 0;
  const skipped = [];
  const projectCache = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const projectName = (row.projectName || "").toString().trim();
    const indicatorName = (row.indicatorName || "").toString().trim();
    if (!projectName || !indicatorName) { skipped.push({ row: i + 1, reason: "Missing project name or indicator name" }); continue; }

    const sectorCheck = strictPick(VALID_SECTORS, row.sector, "education");
    if (!sectorCheck.ok) { skipped.push({ row: i + 1, reason: `Invalid Sector value "${row.sector}" (must be one of: ${VALID_SECTORS.join(", ")})` }); continue; }

    const targetRaw = String(row.target ?? "").trim();
    const target = Number(targetRaw);
    if (!targetRaw || isNaN(target) || target < 0) { skipped.push({ row: i + 1, reason: `Invalid or missing Target value "${row.target}"` }); continue; }

    const actualRaw = String(row.actual ?? "").trim();
    const actual = actualRaw ? Number(actualRaw) : 0;
    if (actualRaw && isNaN(actual)) { skipped.push({ row: i + 1, reason: `Invalid Actual value "${row.actual}"` }); continue; }

    const unit = (row.unit || "").toString().trim();
    if (!unit) { skipped.push({ row: i + 1, reason: "Missing unit" }); continue; }

    try {
      let projectId = projectCache[projectName.toLowerCase()];
      if (!projectId) {
        let project = await prisma.project.findFirst({ where: { name: projectName } });
        if (!project) {
          project = await prisma.project.create({
            data: {
              name: projectName,
              sector: sectorCheck.value,
              district: (row.district || "").toString().trim() || "Ngorongoro",
            },
          });
        }
        projectId = project.id;
        projectCache[projectName.toLowerCase()] = projectId;
      }

      await prisma.indicator.create({ data: { projectId, name: indicatorName, target, actual, unit } });
      created++;
    } catch { skipped.push({ row: i + 1, reason: "Could not save record" }); }
  }
  revalidatePath("/projects");
  revalidatePath("/");
  return { created, skipped, total: rows.length };
}

export async function importIndicatorUpdates(rows) {
  let updated = 0;
  const skipped = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const idRaw = String(row.indicatorId ?? "").trim();
    const indicatorId = Number(idRaw);
    const actualRaw = String(row.actual ?? "").trim();
    const newActual = Number(actualRaw);

    if (!idRaw || isNaN(indicatorId)) { skipped.push({ row: i + 1, reason: "Missing or invalid Indicator ID" }); continue; }
    if (!actualRaw || isNaN(newActual)) { skipped.push({ row: i + 1, reason: "Missing or invalid New actual value" }); continue; }

    const exists = await prisma.indicator.findUnique({ where: { id: indicatorId } });
    if (!exists) { skipped.push({ row: i + 1, reason: `Indicator ID ${indicatorId} not found` }); continue; }

    try {
      await prisma.$transaction([
        prisma.indicator.update({ where: { id: indicatorId }, data: { actual: newActual } }),
        prisma.indicatorUpdate.create({ data: { indicatorId, newActual, note: "Bulk import update" } }),
      ]);
      updated++;
    } catch { skipped.push({ row: i + 1, reason: "Could not save update" }); }
  }
  revalidatePath("/projects");
  revalidatePath("/");
  return { created: updated, skipped, total: rows.length };
}

export async function importRisks(rows, projects) {
  const projectByName = {};
  projects.forEach((p) => { projectByName[p.name.toLowerCase().trim()] = p.id; });

  let created = 0;
  const skipped = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const title = (row.title || "").toString().trim();
    if (!title) { skipped.push({ row: i + 1, reason: "Missing risk title" }); continue; }

    const likelihoodCheck = strictPick(VALID_LEVELS, row.likelihood, "Medium");
    if (!likelihoodCheck.ok) { skipped.push({ row: i + 1, reason: `Invalid Likelihood value "${row.likelihood}" (must be Low, Medium, or High)` }); continue; }

    const impactCheck = strictPick(VALID_LEVELS, row.impact, "Medium");
    if (!impactCheck.ok) { skipped.push({ row: i + 1, reason: `Invalid Impact value "${row.impact}" (must be Low, Medium, or High)` }); continue; }

    const statusCheck = strictPick(VALID_RISK_STATUS, row.status, "Open");
    if (!statusCheck.ok) { skipped.push({ row: i + 1, reason: `Invalid Status value "${row.status}" (must be Open, Mitigated, or Closed)` }); continue; }

    const projectName = (row.project || "").toString().trim();
    if (projectName && !projectByName[projectName.toLowerCase()]) {
      skipped.push({ row: i + 1, reason: `Project "${projectName}" not found` });
      continue;
    }

    try {
      await prisma.risk.create({
        data: {
          title,
          description: (row.description || "").toString().trim() || null,
          likelihood: likelihoodCheck.value,
          impact: impactCheck.value,
          mitigation: (row.mitigation || "").toString().trim() || null,
          status: statusCheck.value,
          projectId: projectName ? projectByName[projectName.toLowerCase()] : null,
        },
      });
      created++;
    } catch { skipped.push({ row: i + 1, reason: "Could not save record" }); }
  }
  revalidatePath("/risks");
  revalidatePath("/");
  return { created, skipped, total: rows.length };
}

export async function importFeedback(rows, projects) {
  const projectByName = {};
  projects.forEach((p) => { projectByName[p.name.toLowerCase().trim()] = p.id; });

  let created = 0;
  const skipped = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const note = (row.note || "").toString().trim();
    if (!note) { skipped.push({ row: i + 1, reason: "Missing note/details" }); continue; }

    const categoryCheck = strictPick(VALID_FEEDBACK_CATEGORY, row.category, null);
    if (!categoryCheck.ok || !categoryCheck.value) { skipped.push({ row: i + 1, reason: `Invalid or missing Category "${row.category}" (must be Feedback, Suggestion, or Complaint)` }); continue; }

    const statusCheck = strictPick(VALID_FEEDBACK_STATUS, row.status, "Open");
    if (!statusCheck.ok) { skipped.push({ row: i + 1, reason: `Invalid Status value "${row.status}" (must be Open or Resolved)` }); continue; }

    const district = (row.district || "").toString().trim();
    if (!district) { skipped.push({ row: i + 1, reason: "Missing district" }); continue; }

    const projectName = (row.project || "").toString().trim();
    if (projectName && !projectByName[projectName.toLowerCase()]) {
      skipped.push({ row: i + 1, reason: `Project "${projectName}" not found` });
      continue;
    }

    try {
      await prisma.feedback.create({
        data: {
          category: categoryCheck.value,
          district,
          note,
          status: statusCheck.value,
          projectId: projectName ? projectByName[projectName.toLowerCase()] : null,
        },
      });
      created++;
    } catch { skipped.push({ row: i + 1, reason: "Could not save record" }); }
  }
  revalidatePath("/feedback");
  revalidatePath("/");
  return { created, skipped, total: rows.length };
}

export async function runImport(targetKey, rows, projects) {
  let result;
  switch (targetKey) {
    case "beneficiaries": result = await importBeneficiaries(rows, projects); break;
    case "projects_indicators": result = await importProjectsIndicators(rows); break;
    case "indicator_updates": result = await importIndicatorUpdates(rows); break;
    case "risks": result = await importRisks(rows, projects); break;
    case "feedback": result = await importFeedback(rows, projects); break;
    default: return { created: 0, skipped: [{ row: 0, reason: "Unknown import target" }], total: rows.length };
  }
  const session = await auth();
  await logActivity(session?.user?.name, "Ran data import", `${targetKey}: ${result.created} created, ${result.skipped.length} skipped`, session?.user?.email);
  return result;
}
