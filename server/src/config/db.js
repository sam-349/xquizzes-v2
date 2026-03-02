const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    // Use Google Public DNS to bypass corporate DNS restrictions
    dns.setServers(['8.8.8.8', '8.8.4.4']);

    console.log('🔄 Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`\n💡 If on a corporate network, try:`);
    console.error(`   1. Use standard connection string (not SRV)`);
    console.error(`   2. Connect to a VPN or personal hotspot`);
    console.error(`   3. Use a local MongoDB instance\n`);
    process.exit(1);
  }
};

module.exports = connectDB;
