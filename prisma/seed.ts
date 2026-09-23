import dotenv from 'dotenv';
import { AdminRole, PrismaClient, ProjectStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

dotenv.config();

// الاعتماد حصرياً على الـ Environment Variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@qaza.org';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

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

  // 1. استخدام المتغيرات الآمنة
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const adminData = {
    name: 'Root Admin',
    email: ADMIN_EMAIL,
    passwordHash: hashedPassword,
    role: AdminRole.ADMIN,
  };

  const rootAdmin = await prisma.admin.upsert({
    where: { email: ADMIN_EMAIL },
    update: adminData, // إصلاح البج: الآن لو تغير الاسم أو الصلاحية ستتحدث
    create: {
      id: ids.rootAdmin,
      ...adminData
    },
  });
  console.log(`Root Admin created/updated: ${rootAdmin.email}`);

  // 2. تحديث الإعدادات 
  // ملاحظة: اسم الموقع لم يعد ضمن الإعدادات — أصبح نصاً ثابتاً مترجماً في الواجهة.
  const settingsData = {
    aboutUsTextAr: 'منصة خيرية لدعم المشاريع الإنسانية.',
    aboutUsTextEn: 'A charity platform supporting humanitarian projects.',
    contactEmail: 'contact@qaza.org',
  };

  const settings = await prisma.platformSettings.upsert({
    where: { id: ids.settings },
    update: settingsData, // إصلاح البج
    create: {
      id: ids.settings,
      totalBeneficiaries: 0,
      foodBaskets: 0,
      yearsOfGiving: 0,
      ...settingsData
    },
  });
  console.log(`System settings initialized/updated: ${settings.id}`);

  // 3. الأقسام (باستخدام Promise.all للأداء العالي)
  const categories = [
    { id: ids.foodCategory, nameAr: 'كفالة الأسر', nameEn: 'Family Sponsorship' },
    { id: ids.waterCategory, nameAr: 'المياه', nameEn: 'Water' },
    { id: ids.educationCategory, nameAr: 'التعليم', nameEn: 'Education' },
  ];

  await Promise.all(
    categories.map(categoryData =>
      prisma.category.upsert({
        where: { id: categoryData.id },
        update: { nameAr: categoryData.nameAr, nameEn: categoryData.nameEn }, // تحديث عند التعديل
        create: categoryData,
      })
    )
  );
  console.log(`${categories.length} Categories seeded.`);

  // 4. المشاريع (باستخدام Promise.all للأداء العالي)
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
      status: ProjectStatus.COMPLETED, // ملاحظة: هذا مكتمل!
      categoryId: ids.educationCategory,
    },
  ];

  await Promise.all(
    sampleProjects.map(projectData => {
      const { id, ...dataToUpdate } = projectData;
      return prisma.project.upsert({
        where: { id: projectData.id },
        update: dataToUpdate, // لضمان تحديث النصوص أو المبالغ لو تم تغييرها في الكود
        create: projectData,
      });
    })
  );
  console.log(`${sampleProjects.length} Projects seeded.`);

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });