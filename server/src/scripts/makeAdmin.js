/**
 * Seed script to promote a user to admin role.
 * Usage: node src/scripts/makeAdmin.js <email>
 * Example: node src/scripts/makeAdmin.js admin@test.com
 */
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Use Google DNS for corporate networks
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('../models/User');

async function makeAdmin() {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: node src/scripts/makeAdmin.js <email>');
    console.log('Example: node src/scripts/makeAdmin.js admin@test.com');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`ℹ️  ${user.name} (${user.email}) is already an admin.`);
    } else {
      user.role = 'admin';
      await user.save();
      console.log(`✅ ${user.name} (${user.email}) is now an ADMIN!`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

makeAdmin();
