import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool as any);

const prisma = new PrismaClient({ adapter }); 
async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: 'admin@admin.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
    },
  });

  console.log('✅ Admin seeded');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // ✅ VERY IMPORTANT (close pool)
  });