// backend/scripts/migrateOrders.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js'; // adjust if your model path differs

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ Mongo connection error:', err.message);
    process.exit(1);
  });

async function run() {
  try {
    const result = await Order.updateMany(
      { status: { $exists: false } },
      {
        $set: {
          status: 'Ordered',
          statusHistory: [{ status: 'Ordered', timestamp: new Date() }],
        },
      }
    );

    console.log(`✅ Orders updated: ${result.modifiedCount}`);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    mongoose.connection.close();
  }
}

run();
