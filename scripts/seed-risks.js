const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany();
  const findProject = (nameFragment) => projects.find((p) => p.name.includes(nameFragment));

  const risks = [
    {
      title: "Drought reducing water point yield",
      description: "Prolonged dry season may reduce output of rehabilitated water points below target.",
      likelihood: "High",
      impact: "High",
      mitigation: "Explore solar-powered pumping and rainwater harvesting as backup sources.",
      status: "Open",
      project: findProject("Naado Clean Water"),
    },
    {
      title: "Low male community buy-in for leadership forum",
      description: "Resistance from some male elders could reduce women's participation in council elections.",
      likelihood: "Medium",
      impact: "High",
      mitigation: "Engage male elders early through dialogue sessions before election cycles.",
      status: "Mitigated",
      project: findProject("Olkerii Women's Leadership"),
    },
    {
      title: "Loan repayment delays in VSLA groups",
      description: "Seasonal cash flow among pastoralist households may cause repayment delays.",
      likelihood: "Medium",
      impact: "Medium",
      mitigation: "Align repayment schedules with livestock sale seasons.",
      status: "Open",
      project: findProject("Esiteti VSLA"),
    },
    {
      title: "School dropout during migration season",
      description: "Families migrating with livestock during dry season may pull girls out of school temporarily.",
      likelihood: "High",
      impact: "Medium",
      mitigation: "Coordinate with boarding facilities to house girls during migration periods.",
      status: "Open",
      project: findProject("Enkishon Girls"),
    },
    {
      title: "Community health worker attrition",
      description: "Trained CHWs may relocate or discontinue volunteering without incentives.",
      likelihood: "Medium",
      impact: "Medium",
      mitigation: "Introduce small performance-based stipends and recognition events.",
      status: "Closed",
      project: findProject("Osotua Maternal"),
    },
    {
      title: "Rangeland restoration land disputes",
      description: "Unclear grazing land boundaries could cause disputes over restored rangeland.",
      likelihood: "Low",
      impact: "High",
      mitigation: "Work with village land committees to formally document restoration zones.",
      status: "Open",
      project: findProject("Enkop Climate"),
    },
    {
      title: "Data protection compliance gap",
      description: "General organizational risk: beneficiary data handling processes not yet fully documented.",
      likelihood: "Medium",
      impact: "High",
      mitigation: "Complete a data protection policy aligned with Tanzanian law and train staff.",
      status: "Open",
      project: null,
    },
  ];

  for (const r of risks) {
    await prisma.risk.create({
      data: {
        title: r.title,
        description: r.description,
        likelihood: r.likelihood,
        impact: r.impact,
        mitigation: r.mitigation,
        status: r.status,
        projectId: r.project ? r.project.id : null,
      },
    });
  }

  console.log(`Created ${risks.length} risks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
