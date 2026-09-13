import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'changeme', 10);
  await prisma.user.upsert({
    where: { username: 'admin01' },
    update: { role: 'admin' },
    create: { username: 'admin01', password: hashedPassword, role: 'admin' },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
