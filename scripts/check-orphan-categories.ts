/**
 * Read-only integrity check: do any projects point at a category id that no
 * longer exists? Prisma/MongoDB does not enforce referential integrity, so an
 * orphaned `categoryId` is possible and would make a project invisible in every
 * category filter while still claiming to be categorized.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({ select: { id: true, nameEn: true } });
  const categoryIds = new Set(categories.map((c) => c.id));

  const projects = await prisma.project.findMany({
    select: { id: true, titleAr: true, categoryId: true, deletedAt: true },
  });

  console.log('=== ORPHANED CATEGORY REFERENCES ===');
  let orphans = 0;

  for (const project of projects) {
    if (!project.categoryId) {
      console.log(`  [uncategorized]        ${project.titleAr} (${project.id}) deletedAt=${project.deletedAt}`);
      continue;
    }

    if (!categoryIds.has(project.categoryId)) {
      orphans += 1;
      console.log(
        `  [ORPHAN -> ${project.categoryId}] ${project.titleAr} (${project.id}) deletedAt=${project.deletedAt}`,
      );
      continue;
    }

    const name = categories.find((c) => c.id === project.categoryId)?.nameEn;
    console.log(`  [ok -> ${name}]         ${project.titleAr} (${project.id})`);
  }

  console.log(`ORPHANED REFERENCES: ${orphans}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
