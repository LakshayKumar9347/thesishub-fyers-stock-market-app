const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.log("Cann't Establish Connection To The Database");
  }
};

module.exports = connectDB;
