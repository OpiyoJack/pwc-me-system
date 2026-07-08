const { prisma } = require("./prisma");

// Computes a single indicator's value from the Beneficiary table based on
// its saved formula. This is the one shared calculation used everywhere:
// manual "recalculate" clicks, and automatic triggers after new data comes in
// (manual entry or any import — Excel, KOBO, etc. — since they all funnel
// into the same Beneficiary table).
async function computeFormulaValue(formula, projectId) {
  if (formula.operator === "count_all") {
    return prisma.beneficiary.count({ where: { projectId } });
  }

  // Any operator besides count_all needs a comparison value — if it's
  // missing (e.g. an incomplete formula was saved), skip the calculation
  // rather than crashing.
  if (!formula.value || !formula.value.toString().trim()) {
    console.warn(`Formula for field "${formula.field}" is missing a value — skipping calculation.`);
    return null;
  }

  const fieldValue = formula.field === "age" ? Number(formula.value) : formula.value;
  const where = { projectId };

  if (formula.operator === "count_gte") {
    where[formula.field] = { gte: fieldValue };
  } else {
    where[formula.field] = fieldValue;
  }

  const matchCount = await prisma.beneficiary.count({ where });

  if (formula.operator === "percent_equals") {
    const total = await prisma.beneficiary.count({ where: { projectId } });
    return total > 0 ? Math.round((matchCount / total) * 100) : 0;
  }

  return matchCount;
}

async function recalculateIndicator(indicatorId) {
  const indicator = await prisma.indicator.findUnique({
    where: { id: indicatorId },
    include: { formula: true },
  });
  if (!indicator || !indicator.formula) return null;

  const newActual = await computeFormulaValue(indicator.formula, indicator.projectId);
  if (newActual === null) return null; // incomplete formula — leave the current value untouched

  await prisma.$transaction([
    prisma.indicator.update({ where: { id: indicatorId }, data: { actual: newActual } }),
    prisma.indicatorUpdate.create({
      data: { indicatorId, newActual, note: "Auto-calculated from formula" },
    }),
  ]);

  return newActual;
}

// Called after any beneficiary data change (manual add or import) so every
// formula-driven indicator for that project reflects the latest data.
async function recalculateProjectFormulas(projectId) {
  const indicators = await prisma.indicator.findMany({
    where: { projectId, formula: { isNot: null } },
    include: { formula: true },
  });
  for (const indicator of indicators) {
    await recalculateIndicator(indicator.id);
  }
}

module.exports = { computeFormulaValue, recalculateIndicator, recalculateProjectFormulas };
