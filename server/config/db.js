const path = require('path');
const mongoose = require('mongoose');

// Ensure env variables are loaded even if db.js is required in isolation
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const DEFAULT_MONGO_URI = 'mongodb+srv://kumarsulabh2003_db_user:sFqD5jHTamm3rmj0@cluster0.zyahau4.mongodb.net/';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || DEFAULT_MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is undefined. Please verify server/.env');
    }
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
