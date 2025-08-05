require('dotenv').config();
const mongoose = require('mongoose');

async function clearDB() {
  await mongoose.connect(process.env.MONGO_URI);
  const Course = mongoose.model('Course', new mongoose.Schema({}), 'courses');
  await Course.deleteMany({});
  console.log('Base de datos limpiada');
  mongoose.disconnect();
}

clearDB();