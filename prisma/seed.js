const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DISTRICTS = ["Ngorongoro", "Longido", "Monduli"];

async function main() {
  console.log("Clearing existing data...");
  await prisma.indicator.deleteMany();
  await prisma.project.deleteMany();
  await prisma.beneficiary.deleteMany();
  await prisma.member.deleteMany();
  await prisma.feedback.deleteMany();

  console.log("Creating projects and indicators...");
  await prisma.project.create({
    data: {
      name: "Enkishon Girls' Bridge Scholarship",
      sector: "education",
      district: "Ngorongoro",
      indicators: {
        create: [
          { name: "Girls enrolled with full scholarship support", target: 300, actual: 214, unit: "girls" },
          { name: "School retention rate at term end", target: 90, actual: 78, unit: "%" },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      name: "Esiteti VSLA Microcredit Circles",
      sector: "economic",
      district: "Longido",
      indicators: {
        create: [
          { name: "Women active in savings & loan groups", target: 500, actual: 431, unit: "women" },
          { name: "Group-run enterprises launched", target: 60, actual: 37, unit: "enterprises" },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      name: "Olkerii Women's Leadership Forum",
      sector: "rights",
      district: "Monduli",
      indicators: {
        create: [
          { name: "Women elected to village councils", target: 40, actual: 22, unit: "women" },
          { name: "Rights awareness sessions held", target: 80, actual: 65, unit: "sessions" },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      name: "Osotua Maternal & Reproductive Health",
      sector: "health",
      district: "Ngorongoro",
      indicators: {
        create: [
          { name: "Women reached with clinic outreach", target: 1200, actual: 940, unit: "women" },
          { name: "Community health workers trained", target: 25, actual: 25, unit: "CHWs" },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      name: "Naado Clean Water Access",
      sector: "water",
      district: "Longido",
      indicators: {
        create: [
          { name: "Households with reliable water access", target: 400, actual: 268, unit: "households" },
          { name: "Water points rehabilitated", target: 12, actual: 9, unit: "points" },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      name: "Enkop Climate Resilience Initiative",
      sector: "climate",
      district: "Monduli",
      indicators: {
        create: [
          { name: "Households adopting drought-resilient practice", target: 350, actual: 190, unit: "households" },
          { name: "Rangeland restoration hectares", target: 150, actual: 112, unit: "ha" },
        ],
      },
    },
  });

  console.log("Creating beneficiaries...");
  const names = ["Naserian K.", "Nashipai T.", "Nolkishu S.", "Siyoi M.", "Nasieku P.",
    "Namunyak L.", "Nemburis O.", "Sianga R.", "Ntoipo W.", "Naisula B."];
  const sectors = ["education", "economic", "rights", "health", "water", "climate"];
  for (let i = 0; i < names.length; i++) {
    await prisma.beneficiary.create({
      data: {
        name: names[i],
        sex: i % 4 === 0 ? "Male" : "Female",
        age: 18 + ((i * 7) % 45),
        district: DISTRICTS[i % DISTRICTS.length],
        sector: sectors[i % sectors.length],
      },
    });
  }

  console.log("Creating members...");
  const memberNames = ["Grace M.", "Faith L.", "Joyce N.", "Mary S.", "Agnes T.", "Esther K.", "Judith P.", "Alice R."];
  const villages = ["Loliondo", "Esiteti", "Olkerii", "Naado", "Enkop", "Osotua"];
  for (let i = 0; i < memberNames.length; i++) {
    await prisma.member.create({
      data: {
        name: memberNames[i],
        village: villages[i % villages.length],
        district: DISTRICTS[i % DISTRICTS.length],
        status: i % 5 === 0 ? "Pending" : "Active",
      },
    });
  }

  console.log("Creating feedback...");
  await prisma.feedback.createMany({
    data: [
      { category: "Complaint", district: "Ngorongoro", note: "Distribution delay for scholarship materials.", status: "Open" },
      { category: "Suggestion", district: "Longido", note: "Request for a second VSLA meeting day.", status: "Resolved" },
      { category: "Feedback", district: "Monduli", note: "Positive response to leadership forum.", status: "Resolved" },
      { category: "Complaint", district: "Longido", note: "Water point pump making unusual noise.", status: "Open" },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
