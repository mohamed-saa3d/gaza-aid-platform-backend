/**
 * Authoritative category<->project linkage report.
 * Prints category id AND the projects actually pointing at it, plus any orphan.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({ orderBy: { order: 'asc' } });
  const allIds = await prisma.project.findMany({ select: { id: true, titleAr: true, categoryId: true, deletedAt: true } });
  const liveIds = allIds.filter((p) => p.deletedAt === null);

  console.log('=== CATEGORY -> LIVE PROJECTS ===');
  for (const category of categories) {
    const linked = liveIds.filter((p) => p.categoryId === category.id);
    console.log(
      `${category.order} | ${category.nameEn} (${category.id}) -> ${linked.length} live project(s)`,
    );
    for (const project of linked) {
      console.log(`      ${project.titleAr}`);
    }
  }

  const categoryIds = new Set(categories.map((c) => c.id));
  const orphans = liveIds.filter((p) => p.categoryId && !categoryIds.has(p.categoryId));
  const uncategorized = liveIds.filter((p) => !p.categoryId);

  console.log(`=== LIVE PROJECTS: ${liveIds.length} total ===`);
  console.log(`  categorized  : ${liveIds.length - orphans.length - uncategorized.length}`);
  console.log(`  uncategorized: ${uncategorized.length}`);
  console.log(`  ORPHANED     : ${orphans.length}`);
  for (const orphan of orphans) {
    console.log(`      ORPHAN ${orphan.titleAr} -> ${orphan.categoryId}`);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
