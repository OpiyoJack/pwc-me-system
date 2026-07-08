const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({ where: { name: { contains: "Emanyata" } } });
  if (!project) { console.log("Project not found."); return; }

  const names = ["Naipanoi K.", "Nashipae T.", "Nasieku P.", "Namelok S.", "Nkoko J.", "Sipirian M.", "Kileken R.", "Lemaron W."];
  for (let i = 0; i < names.length; i++) {
    await prisma.beneficiary.create({
      data: {
        name: names[i],
        sex: i % 3 === 0 ? "Male" : "Female",
        age: 13 + (i * 2),
        district: project.district,
        sector: project.sector,
        projectId: project.id,
      },
    });
  }
  console.log(`Added ${names.length} test beneficiaries to ${project.name}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
