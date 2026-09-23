/**
 * Read-only inventory of categories + projects.
 * Used to decide the SAFE category reset strategy (never destroys projects).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({ orderBy: { createdAt: 'asc' } });

  console.log('=== CATEGORIES ===');
  for (const category of categories) {
    const linked = await prisma.project.count({ where: { categoryId: category.id } });
    console.log(
      `${category.id} | ${category.nameAr} | ${category.nameEn} | projects=${linked}`,
    );
  }
  console.log(`TOTAL CATEGORIES: ${categories.length}`);

  const projects = await prisma.project.findMany({
    select: { id: true, titleAr: true, titleEn: true, categoryId: true, status: true, deletedAt: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log('=== PROJECTS ===');
  for (const project of projects) {
    console.log(
      `${project.id} | ${project.titleAr} | ${project.titleEn} | categoryId=${project.categoryId} | ${project.status} | deletedAt=${project.deletedAt}`,
    );
  }
  console.log(`TOTAL PROJECTS: ${projects.length}`);

  const ratings = await prisma.platformRating.findMany();
  console.log('=== PLATFORM RATINGS ===');
  console.log(`count=${ratings.length}`);
  for (const rating of ratings) {
    console.log(`${rating.id} | value=${rating.value} | userId=${rating.userId}`);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
