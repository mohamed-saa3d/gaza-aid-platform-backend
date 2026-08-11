import { AdminRole, PrismaClient, ProjectStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ids = {
  rootAdmin: '64f000000000000000000001',
  settings: '64f000000000000000000002',
  foodCategory: '64f000000000000000000003',
  waterCategory: '64f000000000000000000004',
  educationCategory: '64f000000000000000000005',
  familiesProject: '64f000000000000000000006',
  waterWellsProject: '64f000000000000000000007',
  studentSupportProject: '64f000000000000000000008',
};

async function main() {
  console.log('Starting database seeding...');

  const rootAdminEmail = 'admin@qaza.org';
  const hashedPassword = await bcrypt.hash('Admin@123456', 12);

  const rootAdmin = await prisma.admin.upsert({
    where: { email: rootAdminEmail },
    update: {},
    create: {
      id: ids.rootAdmin,
      name: 'Root Admin',
      email: rootAdminEmail,
      passwordHash: hashedPassword,
      role: AdminRole.ADMIN,
    },
  });
  console.log(`Root Admin created/verified: ${rootAdmin.email}`);

  const settings = await prisma.platformSettings.upsert({
    where: { id: ids.settings },
    update: {},
    create: {
      id: ids.settings,
      siteNameAr: 'منصة قضاء',
      siteNameEn: 'Qaza Platform',
      aboutUsTextAr: 'منصة خيرية لدعم المشاريع الإنسانية.',
      aboutUsTextEn: 'A charity platform supporting humanitarian projects.',
      contactEmail: 'contact@qaza.org',
      totalBeneficiaries: 0,
      foodBaskets: 0,
      yearsOfGiving: 0,
    },
  });
  console.log(`System settings initialized: ${settings.siteNameEn}`);

  const categories = [
    {
      id: ids.foodCategory,
      nameAr: 'كفالة الأسر',
      nameEn: 'Family Sponsorship',
    },
    {
      id: ids.waterCategory,
      nameAr: 'المياه',
      nameEn: 'Water',
    },
    {
      id: ids.educationCategory,
      nameAr: 'التعليم',
      nameEn: 'Education',
    },
  ];

  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { id: categoryData.id },
      update: {},
      create: categoryData,
    });
    console.log(`Category seeded: ${category.nameEn}`);
  }

  const sampleProjects = [
    {
      id: ids.familiesProject,
      titleAr: 'مشروع كفالة الأسر المتعففة',
      titleEn: 'Family Sponsorship Project',
      descriptionAr: 'توفير السلال الغذائية والدعم الشهري للأسر الأكثر احتياجاً.',
      descriptionEn: 'Providing food baskets and monthly support to families in need.',
      targetAmount: 50000,
      collectedAmount: 15000,
      status: ProjectStatus.ACTIVE,
      categoryId: ids.foodCategory,
    },
    {
      id: ids.waterWellsProject,
      titleAr: 'مشروع حفر آبار المياه الصالحة للشرب',
      titleEn: 'Water Wells Project',
      descriptionAr: 'حفر وتجهيز آبار مياه شرب في المناطق النائية وتوفير خزان رئيسي.',
      descriptionEn: 'Building drinking-water wells in remote areas with main storage tanks.',
      targetAmount: 120000,
      collectedAmount: 45000,
      status: ProjectStatus.ACTIVE,
      categoryId: ids.waterCategory,
    },
    {
      id: ids.studentSupportProject,
      titleAr: 'مشروع كفالة طالب علم',
      titleEn: 'Student Support Program',
      descriptionAr: 'دعم المصروفات الدراسية والكتب والأدوات لمجموعة من الطلاب المستحقين.',
      descriptionEn: 'Supporting tuition, books, and supplies for eligible students.',
      targetAmount: 30000,
      collectedAmount: 30000,
      status: ProjectStatus.COMPLETED,
      categoryId: ids.educationCategory,
    },
  ];

  for (const projectData of sampleProjects) {
    const project = await prisma.project.upsert({
      where: { id: projectData.id },
      update: {},
      create: projectData,
    });
    console.log(`Project seeded: ${project.titleEn}`);
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
