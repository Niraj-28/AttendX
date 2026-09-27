/**
 * Create Faculty Script
 * Usage: node scripts/create-faculty.js
 * 
 * This script creates a new faculty member with proper password hashing
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/config/database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const createFaculty = async () => {
  try {
    console.log('\n=== Create New Faculty Member ===\n');

    // Get faculty details
    const name = await question('Enter full name: ');
    const email = await question('Enter email: ');
    const department = await question('Enter department: ');
    const phone = await question('Enter phone number: ');
    const password = await question('Enter password (or press Enter for default "admin123"): ') || 'admin123';

    // Validate inputs
    if (!name || !email || !department) {
      console.error('\n❌ Error: Name, email, and department are required!');
      process.exit(1);
    }

    // Check if email already exists
    const [existing] = await db.query('SELECT email FROM faculty WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.error(`\n❌ Error: Faculty with email ${email} already exists!`);
      process.exit(1);
    }

    // Hash password
    console.log('\n⏳ Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert into database
    console.log('⏳ Creating faculty record...');
    const [result] = await db.query(
      `INSERT INTO faculty (name, email, department, phone, password_hash) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, department, phone || null, passwordHash]
    );

    console.log('\n✅ Faculty member created successfully!');
    console.log('\n📋 Faculty Details:');
    console.log('─────────────────────────────────');
    console.log(`Faculty ID: ${result.insertId}`);
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Department: ${department}`);
    console.log(`Phone: ${phone || 'Not provided'}`);
    console.log(`Password: ${password}`);
    console.log('─────────────────────────────────');
    console.log('\n🔑 Login Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Role: Faculty');
    console.log('\n✨ Faculty member can now login to the system!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating faculty:', error.message);
    process.exit(1);
  }
};

// Run the script
createFaculty();
