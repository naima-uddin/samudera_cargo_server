const bcrypt = require('bcryptjs');
const UserModel = require('./src/models/userModel');

async function seedDefaultAdmin() {
  const adminCount = await UserModel.countDocuments({ role: 'admin' });
  if (adminCount > 0) {
    console.log(`ℹ️ Admin seed skipped - ${adminCount} admin(s) already exist.`);
    return;
  }

  const defaultAdminEmail = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@cargo.com').toLowerCase();
  const existingEmailUser = await UserModel.findOne({ email: defaultAdminEmail });

  if (existingEmailUser) {
    console.log(`⚠️ Default admin email ${defaultAdminEmail} already exists. Admin seed skipped.`);
    return;
  }

  const defaultAdmin = {
    firstName: process.env.ADMIN_DEFAULT_FIRSTNAME || 'Super',
    lastName: process.env.ADMIN_DEFAULT_LASTNAME || 'Admin',
    email: defaultAdminEmail,
    password: process.env.ADMIN_DEFAULT_PASSWORD || '123456',
    phone: process.env.ADMIN_DEFAULT_PHONE || '01700000000',
    role: 'admin',
    provider: 'local',
    isVerified: true,
    status: 'active',
    isActive: true,
    adminLevel: 'super_admin',
    accessLevel: 'full',
    canCreateStaff: true,
    canApprovePayments: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const salt = await bcrypt.genSalt(10);
  defaultAdmin.password = await bcrypt.hash(defaultAdmin.password, salt);

  await new UserModel(defaultAdmin).save();
  console.log(`✅ Default admin seeded: ${defaultAdminEmail}`);
}

module.exports = seedDefaultAdmin;
