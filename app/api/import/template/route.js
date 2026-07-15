import { prisma } from "../../../../lib/prisma";
import { IMPORT_TARGETS } from "../../../../app/import/mapping-helpers";
import TZ_DISTRICTS from "../../../../lib/tanzania-districts";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const SEX_OPTIONS = ["Female", "Male"];
const SECTOR_OPTIONS = ["education", "economic", "rights", "health", "water", "climate"];
const LEVEL_OPTIONS = ["Low", "Medium", "High"];
const RISK_STATUS_OPTIONS = ["Open", "Mitigated", "Closed"];
const FEEDBACK_CATEGORY_OPTIONS = ["Feedback", "Suggestion", "Complaint"];
const FEEDBACK_STATUS_OPTIONS = ["Open", "Resolved"];

// Which Data-sheet column (by field key) should get a dropdown, and which
// Lists-sheet column supplies its values. Some fields need a different list
// depending on the target (e.g. "status" means something different for
// risks vs. feedback), so we key those by targetKey too.
// Maps each field key to the *name* of its list (not the column letter —
// that gets resolved separately via listCols/listLengths using this name).
function getValidationMap(targetKey) {
  const common = {
    district: "district",
    sector: "sector",
    project: "project",
    projectName: "project",
    sex: "sex",
  };
  if (targetKey === "risks") {
    return { ...common, likelihood: "level", impact: "level", status: "riskStatus" };
  }
  if (targetKey === "feedback") {
    return { ...common, category: "feedbackCategory", status: "feedbackStatus" };
  }
  return common;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetKey = searchParams.get("target");
  const targetDef = IMPORT_TARGETS[targetKey];
  if (!targetDef) {
    return new Response("Unknown import target", { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PWC M&E Platform";
  workbook.created = new Date();

  const logoPath = path.join(process.cwd(), "public", "pwc-logo.png");

  // --- Instructions sheet ---
  const instructions = workbook.addWorksheet("Instructions");
  instructions.columns = [{ width: 4 }, { width: 90 }];
  if (fs.existsSync(logoPath)) {
    const logoImageId = workbook.addImage({ filename: logoPath, extension: "png" });
    instructions.addImage(logoImageId, { tl: { col: 1, row: 1 }, ext: { width: 70, height: 58 } });
  }
  instructions.getCell("B6").value = "Pastoral Women's Council";
  instructions.getCell("B6").font = { bold: true, size: 16, color: { argb: "FF1B3A5C" } };
  instructions.getCell("B7").value = `Import Template — ${targetDef.label}`;
  instructions.getCell("B7").font = { size: 12.5, color: { argb: "FF665F52" } };

  instructions.getCell("B10").value = "How to use this template:";
  instructions.getCell("B10").font = { bold: true, size: 11 };
  instructions.getCell("B11").value = "1. Fill in the 'Data' sheet — do not change the column headers.";
  instructions.getCell("B12").value = "2. Required columns are marked with * and must not be left blank.";
  instructions.getCell("B13").value = "3. Columns like District, Sector, and Project have dropdown lists — click a cell and choose from the options that appear.";
  instructions.getCell("B14").value = "4. Remove the example row before importing your real data, or leave it — rows with real project names will simply be skipped if incomplete.";
  instructions.getCell("B15").value = "5. Upload this file back into the Import Data page in the PWC M&E Platform.";

  if (targetDef.notes) {
    instructions.getCell("B17").value = "Notes:";
    instructions.getCell("B17").font = { bold: true, size: 11 };
    instructions.getCell("B18").value = targetDef.notes;
    instructions.getCell("B18").alignment = { wrapText: true };
    instructions.getRow(18).height = 40;
  }

  // --- Hidden Lists sheet (dropdown source data) ---
  const flatDistricts = TZ_DISTRICTS.flatMap((r) => r.districts);
  const projects = await prisma.project.findMany({ orderBy: { name: "asc" } });
  const projectNames = projects.map((p) => p.name);

  const listsSheet = workbook.addWorksheet("Lists", { state: "veryHidden" });
  const listCols = { district: "A", sector: "B", project: "C", sex: "D", level: "E", riskStatus: "F", feedbackCategory: "G", feedbackStatus: "H" };
  const columnsData = [
    flatDistricts, SECTOR_OPTIONS, projectNames, SEX_OPTIONS,
    LEVEL_OPTIONS, RISK_STATUS_OPTIONS, FEEDBACK_CATEGORY_OPTIONS, FEEDBACK_STATUS_OPTIONS,
  ];
  columnsData.forEach((values, colIdx) => {
    values.forEach((val, rowIdx) => {
      listsSheet.getCell(rowIdx + 1, colIdx + 1).value = val;
    });
  });

  function listRange(colLetter, length) {
    return `Lists!$${colLetter}$1:$${colLetter}$${Math.max(length, 1)}`;
  }
  const listLengths = {
    district: flatDistricts.length, sector: SECTOR_OPTIONS.length, project: Math.max(projectNames.length, 1),
    sex: SEX_OPTIONS.length, level: LEVEL_OPTIONS.length, riskStatus: RISK_STATUS_OPTIONS.length,
    feedbackCategory: FEEDBACK_CATEGORY_OPTIONS.length, feedbackStatus: FEEDBACK_STATUS_OPTIONS.length,
  };

  // --- Data sheet ---
  const dataSheet = workbook.addWorksheet("Data");
  dataSheet.columns = targetDef.fields.map((f) => ({
    header: f.required ? `${f.label} *` : f.label,
    key: f.key,
    width: Math.max(20, f.label.length + 4),
  }));
  dataSheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B3A5C" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  const exampleRow = {};
  targetDef.fields.forEach((f) => { exampleRow[f.key] = f.example || ""; });
  const addedRow = dataSheet.addRow(exampleRow);
  addedRow.eachCell((cell) => { cell.font = { italic: true, color: { argb: "FF999999" } }; });

  if (targetKey === "indicator_updates") {
    const indicators = await prisma.indicator.findMany({ include: { project: true }, orderBy: { id: "asc" } });
    indicators.forEach((ind) => {
      dataSheet.addRow({ indicatorId: ind.id, indicatorName: `${ind.name} (${ind.project.name})`, actual: ind.actual });
    });
  }

  // Apply dropdown validation to every relevant column, for a generous
  // number of rows so users can keep adding data beyond just the example.
  const validationMap = getValidationMap(targetKey);
  const MAX_ROWS = 500;
  targetDef.fields.forEach((f, colIdx) => {
    const listKey = validationMap[f.key];
    if (!listKey) return;
    const colLetter = dataSheet.getColumn(colIdx + 1).letter;
    const range = listRange(listCols[listKey], listLengths[listKey]);
    for (let r = 2; r <= MAX_ROWS; r++) {
      dataSheet.getCell(`${colLetter}${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [range],
        showErrorMessage: true,
        errorStyle: "warning",
        errorTitle: "Not in list",
        error: "Please choose a value from the dropdown, or type your own if this is a new entry.",
      };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `PWC-${targetKey}-template.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
