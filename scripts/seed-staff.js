const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function upsert(name, email, password, role) {
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: { name, email, password: hashed, role },
  });
}

async function main() {
  await upsert("Abisai Mollel", "abisai.mollel@pwc.org", "Coord2026!", "coordinator");
  await upsert("Neema Saitoti", "neema.saitoti@pwc.org", "Coord2026!", "coordinator");
  await upsert("Grace Lekishon", "grace.lekishon@pwc.org", "Coord2026!", "coordinator");

  await upsert("Fatuma Iddi", "fatuma.iddi@pwc.org", "MEOfficer2026!", "meofficer");
  await upsert("David Mwangi", "david.mwangi@pwc.org", "MEOfficer2026!", "meofficer");

  await upsert("USAID Tanzania Rep", "rep@usaid-tz.example.org", "Donor2026!", "donor");
  await upsert("PEPFAR Program Officer", "officer@pepfar.example.org", "Donor2026!", "donor");

  console.log("Staff seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
