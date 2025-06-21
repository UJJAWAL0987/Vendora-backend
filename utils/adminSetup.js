const User = require('../models/User');
const bcrypt = require('bcryptjs');

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const adminData = {
        name: 'Admin User',
        email: process.env.ADMIN_EMAIL || 'admin@ecommerce.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin',
        isActive: true,
        emailVerified: true
      };

      const admin = new User(adminData);
      await admin.save();
      
      console.log('✅ Admin user created successfully');
      console.log(`Email: ${adminData.email}`);
      console.log(`Password: ${adminData.password}`);
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};

module.exports = {
  createAdminUser
}; 