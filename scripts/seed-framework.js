const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function buildFramework(projectNameFragment, goal, outcome, output, extraIndicator) {
  const project = await prisma.project.findFirst({ where: { name: { contains: projectNameFragment } } });
  if (!project) {
    console.log(`Skipped: no project matching "${projectNameFragment}"`);
    return;
  }

  const goalNode = await prisma.frameworkNode.create({
    data: { projectId: project.id, parentId: null, levelLabel: "Goal", title: goal, order: 0 },
  });
  const outcomeNode = await prisma.frameworkNode.create({
    data: { projectId: project.id, parentId: goalNode.id, levelLabel: "Outcome", title: outcome, order: 0 },
  });
  const outputNode = await prisma.frameworkNode.create({
    data: { projectId: project.id, parentId: outcomeNode.id, levelLabel: "Output", title: output, order: 0 },
  });

  // Attach the project's existing indicators to the Output level
  const indicators = await prisma.indicator.findMany({ where: { projectId: project.id } });
  for (const ind of indicators) {
    await prisma.indicator.update({ where: { id: ind.id }, data: { frameworkNodeId: outputNode.id } });
  }

  // Add one extra indicator directly under the output, for variety
  if (extraIndicator) {
    await prisma.indicator.create({
      data: {
        projectId: project.id,
        frameworkNodeId: outputNode.id,
        name: extraIndicator.name,
        target: extraIndicator.target,
        actual: extraIndicator.actual,
        unit: extraIndicator.unit,
      },
    });
  }

  console.log(`Built framework for: ${project.name}`);
}

async function main() {
  await buildFramework(
    "Enkishon Girls",
    "Break the cycle of disempowerment, poverty, and gender inequality among Maasai girls",
    "Increased access to and completion of quality education for Maasai girls",
    "Girls from pastoralist households retained in school with full scholarship support",
    { name: "Girls completing secondary school on scholarship", target: 250, actual: 180, unit: "girls" }
  );

  await buildFramework(
    "Esiteti VSLA",
    "Strengthen the economic independence of pastoralist women",
    "Increased participation of women in savings, credit, and enterprise activity",
    "Functional VSLA groups established and actively managing savings cycles",
    { name: "VSLA groups completing a full savings cycle", target: 20, actual: 14, unit: "groups" }
  );

  await buildFramework(
    "Naado Clean Water",
    "Improve health and reduce time poverty for pastoralist women through water access",
    "Increased reliable access to clean water in target communities",
    "Water points constructed or rehabilitated and functioning",
    { name: "Water points still functional after 6 months", target: 12, actual: 9, unit: "points" }
  );

  console.log("Framework seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
