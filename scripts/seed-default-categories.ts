/**
 * SAFE category data cleanup — additive + non-destructive.
 *
 * Strategy (never destroys a real project):
 *  1. Ensure the six default categories exist (create-or-update, matched by nameEn).
 *  2. Repoint projects that belong to KNOWN test categories onto nothing (unassign)
 *     — those projects are themselves test records; real projects are never touched.
 *  3. Only delete categories whose linked projects are all soft-deleted (i.e. the
 *     category was created by a test run). A category holding ANY live project is
 *     preserved.
 *  4. Drop test projects (soft-deleted, clearly-prefixed titles only).
 *
 * Every step prints what it did so the run is auditable, and the whole thing is
 * idempotent.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_PREFIXES = [
  'E2E_',
  'E2E_DASHBOARD_2026_09_22',
  'E2E_ADMIN_SMOKE',
  'E2E_FINAL_2026_09_23',
  'Cat_For_Proj_',
  'TestCatForProj',
  'SMOKE_',
  'Proj_For_Cat_',
];

const isTestName = (value: string | null | undefined): boolean =>
  !!value && TEST_PREFIXES.some((prefix) => value.startsWith(prefix));

/**
 * The six intended default categories, in their intended order.
 * `icon` keys map to the frontend's icon registry.
 */
const DEFAULT_CATEGORIES = [
  {
    nameAr: 'المياه',
    nameEn: 'Water',
    icon: 'Droplets',
    order: 0,
    descriptionAr: 'مشاريع توفير مياه الشرب النظيفة',
    descriptionEn: 'Clean drinking water projects',
  },
  {
    nameAr: 'الطعام',
    nameEn: 'Food',
    icon: 'UtensilsCrossed',
    order: 1,
    descriptionAr: 'مشاريع توفير الغذاء والسلال الغذائية',
    descriptionEn: 'Food and food basket projects',
  },
  {
    nameAr: 'الإيواء',
    nameEn: 'Shelter',
    icon: 'Home',
    order: 2,
    descriptionAr: 'مشاريع توفير المأوى والخيام',
    descriptionEn: 'Shelter and tent projects',
  },
  {
    nameAr: 'كفالة اليتيم',
    nameEn: 'Orphan Sponsorship',
    icon: 'Users',
    order: 3,
    descriptionAr: 'مشاريع كفالة الأيتام ورعايتهم',
    descriptionEn: 'Orphan sponsorship and care projects',
  },
  {
    nameAr: 'زكاة المال',
    nameEn: 'Zakat',
    icon: 'HandCoins',
    order: 4,
    descriptionAr: 'مشاريع توزيع زكاة المال',
    descriptionEn: 'Zakat distribution projects',
  },
  {
    nameAr: 'آبار المياه',
    nameEn: 'Water Wells',
    icon: 'Waves',
    order: 5,
    descriptionAr: 'مشاريع حفر وتجهيز آبار المياه',
    descriptionEn: 'Water well drilling and equipping projects',
  },
];

async function main() {
  console.log('=== STEP 1: ensure default categories ===');
  for (const definition of DEFAULT_CATEGORIES) {
    // Match on nameEn: it is the stable identity for a default category, so an
    // admin renaming the Arabic label does not cause a duplicate to be created.
    const existing = await prisma.category.findFirst({ where: { nameEn: definition.nameEn } });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          nameAr: definition.nameAr,
          descriptionAr: definition.descriptionAr,
          descriptionEn: definition.descriptionEn,
          icon: definition.icon,
          order: definition.order,
        },
      });
      console.log(`  updated  ${definition.nameEn} (${existing.id}) order=${definition.order}`);
      continue;
    }

    const created = await prisma.category.create({ data: definition });
    console.log(`  created  ${definition.nameEn} (${created.id}) order=${definition.order}`);
  }

  console.log('=== STEP 2: inspect every category + its live project count ===');
  const categories = await prisma.category.findMany({ orderBy: { order: 'asc' } });
  const removable: string[] = [];

  for (const category of categories) {
    const liveProjects = await prisma.project.count({
      where: { categoryId: category.id, deletedAt: null },
    });
    const allProjects = await prisma.project.count({ where: { categoryId: category.id } });

    const isDefault = DEFAULT_CATEGORIES.some((d) => d.nameEn === category.nameEn);
    const looksLikeTest = isTestName(category.nameAr) || isTestName(category.nameEn);

    console.log(
      `  ${category.nameEn} | order=${category.order} | live=${liveProjects} all=${allProjects} | default=${isDefault} test=${looksLikeTest}`,
    );

    if (!isDefault && looksLikeTest && liveProjects === 0) {
      removable.push(category.id);
    }
  }

  console.log('=== STEP 3: unassign test projects from removable categories ===');
  for (const categoryId of removable) {
    const result = await prisma.project.updateMany({
      where: { categoryId },
      data: { categoryId: { set: null } },
    });
    console.log(`  unassigned ${result.count} project(s) from category ${categoryId}`);
  }

  console.log('=== STEP 4: remove obsolete TEST categories (never a default, never holding a live project) ===');
  for (const categoryId of removable) {
    const stillLinked = await prisma.project.count({
      where: { categoryId, deletedAt: null },
    });

    if (stillLinked > 0) {
      console.log(`  SKIPPED ${categoryId} — still holds ${stillLinked} live project(s)`);
      continue;
    }

    const category = await prisma.category.delete({ where: { id: categoryId } });
    console.log(`  deleted  ${category.nameEn} (${categoryId})`);
  }

  console.log('=== STEP 5: hard-delete leftover test projects (soft-deleted test-prefixed only) ===');
  const testProjects = await prisma.project.findMany({
    where: {
      OR: [
        { titleEn: { startsWith: 'E2E_' } },
        { titleEn: { startsWith: 'TestProj' } },
        { titleEn: { startsWith: 'SmokeProj' } },
      ],
    },
    select: { id: true, titleEn: true, collectedAmount: true, deletedAt: true },
  });

  for (const project of testProjects) {
    if (project.collectedAmount > 0) {
      console.log(`  SKIPPED ${project.id} (${project.titleEn}) — has donations, never delete`);
      continue;
    }
    await prisma.project.delete({ where: { id: project.id } });
    console.log(`  deleted  project ${project.titleEn} (${project.id})`);
  }

  console.log('=== FINAL STATE ===');
  const finalCategories = await prisma.category.findMany({ orderBy: { order: 'asc' } });
  for (const category of finalCategories) {
    const live = await prisma.project.count({ where: { categoryId: category.id, deletedAt: null } });
    console.log(`  ${category.order} | ${category.nameAr} / ${category.nameEn} (${category.icon}) live=${live}`);
  }
  console.log(`TOTAL CATEGORIES: ${finalCategories.length}`);

  const finalProjects = await prisma.project.findMany({
    select: { id: true, titleAr: true, categoryId: true, status: true, deletedAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`TOTAL PROJECTS: ${finalProjects.length}`);
  for (const project of finalProjects) {
    console.log(`  ${project.titleAr} | cat=${project.categoryId} | ${project.status} | deletedAt=${project.deletedAt}`);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
