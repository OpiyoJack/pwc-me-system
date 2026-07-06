import { prisma } from "../../../../lib/prisma";
import { IMPORT_TARGETS } from "../../../../app/import/mapping-helpers";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

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
  instructions.getCell("B12").value = "2. Required columns are marked with * on the Data sheet and must not be left blank.";
  instructions.getCell("B13").value = "3. Remove the example row(s) before importing your real data, or leave them — they'll simply be skipped if blank fields are required elsewhere.";
  instructions.getCell("B14").value = "4. Upload this file back into the Import Data page in the PWC M&E Platform.";

  if (targetDef.notes) {
    instructions.getCell("B16").value = "Notes:";
    instructions.getCell("B16").font = { bold: true, size: 11 };
    instructions.getCell("B17").value = targetDef.notes;
    instructions.getCell("B17").alignment = { wrapText: true };
    instructions.getRow(17).height = 40;
  }

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
      dataSheet.addRow({
        indicatorId: ind.id,
        indicatorName: `${ind.name} (${ind.project.name})`,
        actual: ind.actual,
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `PWC-${targetKey}-template.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
