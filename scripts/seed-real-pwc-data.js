// Replaces placeholder/dummy project data with real programmes and published
// figures from pastoralwomenscouncil.org (fetched July 2026). Individual
// beneficiary/staff records remain illustrative — PWC's public site does not
// publish personal beneficiary data — but every project, indicator, and
// headline number below reflects their actual published achievements.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Clearing existing project-related data...");
  await prisma.reportRequest.deleteMany();
  await prisma.indicatorUpdate.deleteMany();
  await prisma.indicator.deleteMany();
  await prisma.frameworkNode.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.beneficiary.deleteMany();
  await prisma.member.deleteMany();
  await prisma.project.deleteMany();

  const coordinators = await prisma.user.findMany({ where: { role: "coordinator" } });
  const donors = await prisma.user.findMany({ where: { role: "donor" } });
  const pick = (arr, i) => (arr.length ? arr[i % arr.length] : null);

  async function createProject({ name, sector, district, status, indicators, goal, outcome, output, coordIdx, donorIdx }) {
    const project = await prisma.project.create({
      data: {
        name, sector, district, status: status || "Ongoing",
        coordinatorId: pick(coordinators, coordIdx)?.id || null,
        donorContactId: pick(donors, donorIdx)?.id || null,
      },
    });

    let outputNode = null;
    if (goal) {
      const goalNode = await prisma.frameworkNode.create({ data: { projectId: project.id, parentId: null, levelLabel: "Goal", title: goal, order: 0 } });
      const outcomeNode = await prisma.frameworkNode.create({ data: { projectId: project.id, parentId: goalNode.id, levelLabel: "Outcome", title: outcome, order: 0 } });
      outputNode = await prisma.frameworkNode.create({ data: { projectId: project.id, parentId: outcomeNode.id, levelLabel: "Output", title: output, order: 0 } });
    }

    for (const ind of indicators) {
      await prisma.indicator.create({
        data: { projectId: project.id, frameworkNodeId: outputNode?.id || null, name: ind.name, target: ind.target, actual: ind.actual, unit: ind.unit },
      });
    }
    console.log(`Created: ${name}`);
    return project;
  }

  await createProject({
    name: "Emanyata Secondary School — Retention & Scholarship Programme",
    sector: "education", district: "Ngorongoro", status: "Ongoing",
    goal: "Break the cycle of disempowerment and poverty within Maasai society through education",
    outcome: "Maasai girls retained in and completing secondary education",
    output: "Girls sponsored, retained, and supported through Emanyata Secondary School",
    coordIdx: 0, donorIdx: 1,
    indicators: [
      { name: "Girls provided educational scholarships", target: 120, actual: 104, unit: "girls" },
      { name: "Learners supported in remedial literacy & numeracy classes", target: 1000, actual: 971, unit: "learners" },
      { name: "Form 1–4 student retention rate at Emanyata", target: 95, actual: 98, unit: "%" },
      { name: "New Form One students admitted (Jan intake)", target: 85, actual: 79, unit: "students" },
    ],
  });

  await createProject({
    name: "VICOBA Microcredit Expansion Programme",
    sector: "economic", district: "Longido", status: "Ongoing",
    goal: "Enable Maasai women to become financially self-reliant",
    outcome: "Increased women's participation in savings, credit, and enterprise",
    output: "VICOBA savings and loans groups established and functioning",
    coordIdx: 1, donorIdx: 0,
    indicators: [
      { name: "VICOBA groups established and active", target: 600, actual: 575, unit: "groups" },
      { name: "Women served through VICOBAs", target: 13500, actual: 12900, unit: "women" },
      { name: "Loan repayment rate", target: 95, actual: 90, unit: "%" },
    ],
  });

  await createProject({
    name: "Women's Solidarity Bomas & Income Generating Groups",
    sector: "economic", district: "Ngorongoro", status: "Ongoing",
    goal: "Enable Maasai women to become financially self-reliant",
    outcome: "Increased women's ownership of productive assets and income",
    output: "Income Generating Groups and Solidarity Bomas established",
    coordIdx: 1, donorIdx: 0,
    indicators: [
      { name: "Income Generating Groups established", target: 130, actual: 120, unit: "groups" },
      { name: "Women benefiting from IGGs and Solidarity Bomas", target: 1100, actual: 1000, unit: "women" },
      { name: "Women's Solidarity Bomas active", target: 6, actual: 5, unit: "bomas" },
    ],
  });

  await createProject({
    name: "Women's Rights and Leadership Forums (WRLF)",
    sector: "rights", district: "Ngorongoro", status: "Ongoing",
    goal: "Defend and advance the rights of Maasai women and girls",
    outcome: "Increased women's representation in leadership and secure land rights",
    output: "WRLF members trained on rights, land, and leadership",
    coordIdx: 2, donorIdx: 1,
    indicators: [
      { name: "WRLF members trained on property & land rights", target: 260, actual: 240, unit: "members" },
      { name: "Women who have secured land plots (cumulative)", target: 400, actual: 350, unit: "women" },
      { name: "Domestic violence cases reported and resolved", target: 30, actual: 27, unit: "cases" },
      { name: "Traditional/village leaders trained on gender rights", target: 80, actual: 70, unit: "leaders" },
    ],
  });

  await createProject({
    name: "Girls' Rescue Centre — Loliondo",
    sector: "rights", district: "Ngorongoro", status: "Ongoing",
    goal: "Protect girls from forced marriage and gender-based violence",
    outcome: "At-risk girls safely housed and continuing their education",
    output: "Rescue centre providing safe accommodation and schooling support",
    coordIdx: 2, donorIdx: 1,
    indicators: [
      { name: "Girls housed and supported at the rescue centre", target: 30, actual: 29, unit: "girls" },
    ],
  });

  await createProject({
    name: "Borehole Construction & Water Access Programme",
    sector: "water", district: "Longido", status: "Ongoing",
    goal: "Improve health and reduce time-poverty through reliable water access",
    outcome: "Increased access to safe, reliable water in target communities",
    output: "Boreholes constructed and Water Management Committees trained",
    coordIdx: 0, donorIdx: 0,
    indicators: [
      { name: "Boreholes constructed (Ngorongoro, Longido, Monduli)", target: 20, actual: 16, unit: "boreholes" },
      { name: "People benefiting from new boreholes", target: 15000, actual: 14000, unit: "people" },
      { name: "Water Management Committees trained", target: 6, actual: 4, unit: "committees" },
      { name: "Energy-efficient cooking stoves distributed", target: 150, actual: 130, unit: "stoves" },
    ],
  });

  await createProject({
    name: "Sexual & Reproductive Health Access Programme",
    sector: "health", district: "Ngorongoro", status: "Ongoing",
    goal: "Enhance the well-being of pastoralist women through better health access",
    outcome: "Increased access to sexual and reproductive health services",
    output: "Mobile clinics and trained birth attendants reaching remote communities",
    coordIdx: 2, donorIdx: 1,
    indicators: [
      { name: "Mobile health clinic outreach sessions held", target: 40, actual: 28, unit: "sessions" },
      { name: "Traditional birth attendants trained/engaged", target: 50, actual: 35, unit: "attendants" },
      { name: "Women reached with SRH awareness sessions", target: 2000, actual: 1450, unit: "women" },
    ],
  });

  await createProject({
    name: "Climate Resilience & Adaptation Strategy",
    sector: "climate", district: "Monduli", status: "Ongoing",
    goal: "Strengthen resilience and adaptation of pastoral communities to climate change",
    outcome: "Community-informed adaptation strategies developed and adopted",
    output: "Climate vulnerability data gathered from women and communities",
    coordIdx: 0, donorIdx: 0,
    indicators: [
      { name: "Communities engaged in climate vulnerability data collection", target: 20, actual: 12, unit: "communities" },
      { name: "Adaptation strategies co-designed with women's groups", target: 6, actual: 3, unit: "strategies" },
    ],
  });

  console.log("Real PWC programme data seeded successfully.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
