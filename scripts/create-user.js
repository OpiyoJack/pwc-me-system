const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const [name, email, password, role] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.log("Usage: node scripts/create-user.js \"Full Name\" email@example.com password [admin|coordinator|donor]");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password: hashed, role: role || "admin" },
    create: { name, email, password: hashed, role: role || "admin" },
  });

  console.log("User ready:", user.email, "role:", user.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
