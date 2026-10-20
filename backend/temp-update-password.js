const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function updatePassword() {
  try {
    const password = 'admin123';
    const email = 'saurin.parikh@nirmauni.ac.in';
    
    // Generate hash
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hash);
    
    // Connect to database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    // Update password
    const [result] = await connection.execute(
      'UPDATE faculty SET password_hash = ? WHERE email = ?',
      [hash, email]
    );
    
    console.log('Update result:', result);
    
    // Verify
    const [users] = await connection.query(
      'SELECT email, password_hash FROM faculty WHERE email = ?',
      [email]
    );
    
    console.log('Stored hash:', users[0].password_hash);
    
    // Test
    const match = await bcrypt.compare(password, users[0].password_hash);
    console.log('Password verification:', match ? '✅ SUCCESS' : '❌ FAILED');
    
    await connection.end();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

updatePassword();
