const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function upsert(name, email, password, role) {
  const hashed = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: { name, email, password: hashed, role },
  });
}

async function main() {
  // Real, publicly documented PWC partners/funders
  const segal = await upsert("Segal Family Foundation", "partner.segal@pwc-donors.example.org", "Donor2026!", "donor");
  const trias = await upsert("TRIAS", "partner.trias@pwc-donors.example.org", "Donor2026!", "donor");
  const ucrt = await upsert("Ujamaa Community Resource Team (UCRT)", "partner.ucrt@pwc-donors.example.org", "Donor2026!", "donor");
  const finland = await upsert("Ministry for Foreign Affairs of Finland", "partner.finland@pwc-donors.example.org", "Donor2026!", "donor");

  // Remove the old fictional placeholder donor accounts
  const oldDonors = await prisma.user.findMany({
    where: { email: { in: ["rep@usaid-tz.example.org", "officer@pepfar.example.org"] } },
  });

  for (const old of oldDonors) {
    // Unlink any projects pointing at the old donor before deleting the account
    await prisma.project.updateMany({ where: { donorContactId: old.id }, data: { donorContactId: null } });
    await prisma.user.delete({ where: { id: old.id } });
    console.log(`Removed placeholder donor: ${old.name}`);
  }

  // Reassign real donor projects sensibly across the new real partners
  const assign = async (fragment, donor) => {
    const project = await prisma.project.findFirst({ where: { name: { contains: fragment } } });
    if (project) {
      await prisma.project.update({ where: { id: project.id }, data: { donorContactId: donor.id } });
      console.log(`Assigned ${donor.name} to ${project.name}`);
    }
  };

  await assign("Emanyata", segal);
  await assign("VICOBA", trias);
  await assign("Solidarity Bomas", trias);
  await assign("WRLF", ucrt);
  await assign("Rescue Centre", segal);
  await assign("Borehole", finland);
  await assign("Reproductive Health", finland);
  await assign("Climate Resilience", ucrt);

  console.log("Real donor partners seeded and assigned.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
