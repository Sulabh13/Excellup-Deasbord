const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 Excellup Server running on port ${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   API URL     : http://localhost:${PORT}/api\n`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

