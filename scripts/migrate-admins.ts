import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function migrateAdmins() {
  // استخدم رابط الاتصال الخاص ببيئة التطوير/الإنتاج
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error('DATABASE_URL must be defined');
  }
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(); // سيأخذ اسم الداتابيز من الـ URI
    const adminsCollection = db.collection('Admin');

    console.log('Starting Admin roles migration...');

    // البحث عن أي Admin يمتلك صلاحيات قديمة
    const result = await adminsCollection.updateMany(
      { role: { $in: ['SUPER_ADMIN', 'EDITOR'] } },
      { $set: { role: 'ADMIN' } }
    );

    console.log(`Migration completed successfully.`);
    console.log(`Matched documents: ${result.matchedCount}`);
    console.log(`Modified documents: ${result.modifiedCount}`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrateAdmins();