import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { UserRole } from '../models/User';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/apartment');
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create a superadmin user
const createSuperAdmin = async () => {
  // Check if superadmin already exists
  const existingSuperAdmin = await User.findOne({ role: UserRole.SUPERADMIN });
  
  if (existingSuperAdmin) {
    console.log('SuperAdmin already exists:', existingSuperAdmin.email);
    return existingSuperAdmin;
  }
  
  // Create new superadmin
  const superAdmin = new User({
    name: 'Super Admin',
    email: process.env.SUPERADMIN_EMAIL || 'admin@apartmentmanager.com',
    password: process.env.SUPERADMIN_PASSWORD || 'Admin@123',
    role: UserRole.SUPERADMIN
  });
  
  await superAdmin.save();
  console.log('SuperAdmin created successfully:', superAdmin.email);
  return superAdmin;
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await createSuperAdmin();
    console.log('Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running script:', error);
    process.exit(1);
  }
};

// Run the script
main(); 