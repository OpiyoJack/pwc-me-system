const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany();
  const byName = (frag) => projects.find((p) => p.name.includes(frag));

  const names = ["Naserian K.", "Nashipai T.", "Nolkishu S.", "Siyoi M.", "Nasieku P.",
    "Namunyak L.", "Nemburis O.", "Sianga R.", "Ntoipo W.", "Naisula B.", "Sarah N.", "Rebecca J."];
  const districts = ["Ngorongoro", "Longido", "Monduli"];
  const targets = [
    { frag: "Emanyata", sector: "education" },
    { frag: "VICOBA", sector: "economic" },
    { frag: "Solidarity Bomas", sector: "economic" },
    { frag: "WRLF", sector: "rights" },
    { frag: "Rescue Centre", sector: "rights" },
    { frag: "Borehole", sector: "water" },
    { frag: "Reproductive Health", sector: "health" },
    { frag: "Climate Resilience", sector: "climate" },
  ];

  let n = 0;
  for (const t of targets) {
    const project = byName(t.frag);
    if (!project) continue;
    for (let i = 0; i < 2; i++) {
      const name = names[n % names.length]; n++;
      await prisma.beneficiary.create({
        data: {
          name, sex: n % 4 === 0 ? "Male" : "Female", age: 18 + (n * 5) % 45,
          district: project.district, sector: t.sector, projectId: project.id,
        },
      });
    }
  }

  await prisma.risk.createMany({
    data: [
      { title: "Drought reducing borehole yield", likelihood: "High", impact: "High", status: "Open",
        mitigation: "Explore solar-powered pumping and rainwater harvesting as backup sources.",
        projectId: byName("Borehole")?.id || null },
      { title: "Loan repayment delays in VICOBA groups", likelihood: "Medium", impact: "Medium", status: "Open",
        mitigation: "Align repayment schedules with livestock sale seasons.",
        projectId: byName("VICOBA")?.id || null },
      { title: "Community resistance to girls' school retention", likelihood: "Medium", impact: "High", status: "Mitigated",
        mitigation: "Engage male elders and parents through dialogue sessions each term.",
        projectId: byName("Emanyata")?.id || null },
      { title: "Land dispute risk around secured plots", likelihood: "Low", impact: "High", status: "Open",
        mitigation: "Work with village land committees to formally document land titles.",
        projectId: byName("WRLF")?.id || null },
    ],
  });

  await prisma.feedback.createMany({
    data: [
      { category: "Complaint", district: "Longido", note: "Delay in VICOBA loan disbursement this cycle.", status: "Open", projectId: byName("VICOBA")?.id || null },
      { category: "Feedback", district: "Ngorongoro", note: "Positive response to remedial classes at Emanyata.", status: "Resolved", projectId: byName("Emanyata")?.id || null },
      { category: "Suggestion", district: "Longido", note: "Request for a second borehole maintenance visit per year.", status: "Open", projectId: byName("Borehole")?.id || null },
    ],
  });

  console.log("Illustrative beneficiary/risk/feedback records seeded.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
