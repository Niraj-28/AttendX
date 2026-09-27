#!/usr/bin/env node
/**
 * Script to create admin faculty account
 * Usage: node scripts/create-admin.js
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

async function createAdmin() {
  console.log('═══════════════════════════════════════');
  console.log('  Create Admin Faculty Account');
  console.log('═══════════════════════════════════════\n');

  try {
    // Get admin details
    const name = await question('Full Name: ');
    const email = await question('Email: ');
    const password = await question('Password (min 6 chars): ');
    const phone = await question('Phone (optional): ');
    const department = await question('Department: ');

    if (!name || !email || !password) {
      console.error('\n❌ Name, email, and password are required!');
      rl.close();
      return;
    }

    if (password.length < 6) {
      console.error('\n❌ Password must be at least 6 characters!');
      rl.close();
      return;
    }

    // Hash password
    console.log('\n⏳ Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    // Connect to database
    console.log('⏳ Connecting to database...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Check if email already exists
    const [existing] = await connection.query(
      'SELECT email FROM faculty WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      console.error('\n❌ Email already exists!');
      await connection.end();
      rl.close();
      return;
    }

    // Insert faculty
    console.log('⏳ Creating admin account...');
    const [result] = await connection.query(
      'INSERT INTO faculty (name, email, password_hash, phone, department) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, phone || null, department]
    );

    console.log('\n✅ Admin account created successfully!');
    console.log('\n═══════════════════════════════════════');
    console.log('  Login Credentials');
    console.log('═══════════════════════════════════════');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Faculty ID: ${result.insertId}`);
    console.log('═══════════════════════════════════════\n');

    await connection.end();
    rl.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
  }
}

createAdmin();
