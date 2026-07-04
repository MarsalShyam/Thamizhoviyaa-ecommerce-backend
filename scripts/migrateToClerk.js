// backend/scripts/migrateToClerk.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in environment variables');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully for migration'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

async function runMigration() {
  try {
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate.`);

    let updatedCount = 0;

    for (const user of users) {
      const updateDoc = {
        $unset: {
          password: '',
          isVerified: '',
          emailVerificationToken: '',
          emailVerificationExpires: '',
          resetPasswordToken: '',
          resetPasswordExpires: ''
        }
      };

      // Set a temporary unique clerkId if they do not have one
      if (!user.clerkId) {
        updateDoc.$set = {
          clerkId: `temp_${user._id.toString()}`
        };
      }

      await User.updateOne({ _id: user._id }, updateDoc);
      updatedCount++;
    }

    console.log(`✅ Successfully migrated ${updatedCount} users.`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

runMigration();
