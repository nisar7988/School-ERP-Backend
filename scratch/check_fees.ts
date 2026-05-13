import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const count = await prisma.feeStructure.count()
  const structures = await prisma.feeStructure.findMany({ include: { class: true } })
  console.log('Count:', count)
  console.log('Structures:', JSON.stringify(structures, null, 2))
}
main()
