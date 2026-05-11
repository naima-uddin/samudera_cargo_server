require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('\n========== SMTP CREDENTIAL CHECK ==========\n');

// Check what's being read from .env
console.log('📋 Environment Variables:');
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST}`);
console.log(`   SMTP_PORT: ${process.env.SMTP_PORT}`);
console.log(`   SMTP_SECURE: ${process.env.SMTP_SECURE}`);
console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-3) : 'NOT SET'}`);
console.log(`   SMTP_USER_INFO: ${process.env.SMTP_USER_INFO}`);
console.log(`   SMTP_PASS_INFO: ${process.env.SMTP_PASS_INFO ? '***' + process.env.SMTP_PASS_INFO.slice(-3) : 'NOT SET'}`);

// Test Tracking credentials
console.log('\n🔧 Test 1: Tracking Email Account (tracking@samuderathai.com)');
console.log('=========================================================');

const trackingTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  logger: true,
  debug: true
});

trackingTransporter.verify((error, success) => {
  if (error) {
    console.log('\n❌ TRACKING AUTH FAILED:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    console.log(`   Response Code: ${error.responseCode}`);
    console.log(`   Command: ${error.command}`);
  } else {
    console.log('\n✅ TRACKING AUTH SUCCESS!');
    console.log('   Account is ready to send emails');
  }
  
  // Test Info credentials
  console.log('\n🔧 Test 2: Info Email Account (info@samuderathai.com)');
  console.log('======================================================');
  
  const infoTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER_INFO,
      pass: process.env.SMTP_PASS_INFO
    },
    logger: true,
    debug: true
  });
  
  infoTransporter.verify((error2, success2) => {
    if (error2) {
      console.log('\n❌ INFO AUTH FAILED:');
      console.log(`   Error: ${error2.message}`);
      console.log(`   Code: ${error2.code}`);
      console.log(`   Response Code: ${error2.responseCode}`);
      console.log(`   Command: ${error2.command}`);
    } else {
      console.log('\n✅ INFO AUTH SUCCESS!');
      console.log('   Account is ready to send emails');
    }
    
    console.log('\n========== TEST COMPLETE ==========\n');
    process.exit(0);
  });
});
