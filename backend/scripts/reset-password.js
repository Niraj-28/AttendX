#!/usr/bin/env node
/**
 * Script to reset user password
 * Usage: node scripts/reset-password.js
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function resetPassword() {
  console.log('═══════════════════════════════════════');
  console.log('  Reset User Password');
  console.log('═══════════════════════════════════════\n');

  try {
    // Get user details
    const role = await question('User type (faculty/student): ');
    
    if (role !== 'faculty' && role !== 'student') {
      console.error('\n❌ Invalid user type! Must be "faculty" or "student"');
      rl.close();
      return;
    }

    const email = await question('User email: ');
    const newPassword = await question('New password (min 6 chars): ');

    if (!email || !newPassword) {
      console.error('\n❌ Email and password are required!');
      rl.close();
      return;
    }

    if (newPassword.length < 6) {
      console.error('\n❌ Password must be at least 6 characters!');
      rl.close();
      return;
    }

    // Hash password
    console.log('\n⏳ Hashing password...');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Connect to database
    console.log('⏳ Connecting to database...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Determine table
    const table = role === 'faculty' ? 'faculty' : 'students';

    // Check if user exists
    const [users] = await connection.query(
      `SELECT name FROM ${table} WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      console.error('\n❌ User not found!');
      await connection.end();
      rl.close();
      return;
    }

    // Update password
    console.log('⏳ Resetting password...');
    await connection.query(
      `UPDATE ${table} SET password_hash = ?, updated_at = NOW() WHERE email = ?`,
      [passwordHash, email]
    );

    console.log('\n✅ Password reset successfully!');
    console.log('\n═══════════════════════════════════════');
    console.log('  New Login Credentials');
    console.log('═══════════════════════════════════════');
    console.log(`Name: ${users[0].name}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log(`Role: ${role}`);
    console.log('═══════════════════════════════════════\n');

    await connection.end();
    rl.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
  }
}

resetPassword();
