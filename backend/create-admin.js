/**
 * Script to create a new admin user
 * Run: node create-admin.js <email> <password>
 * 
 * Example: node create-admin.js admin@cvplatform.com Admin123!
 */

const bcrypt = require('bcryptjs');
const db = require('./src/db');

async function createAdmin(email, password) {
  try {
    // Validate password strength
    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters');
      process.exit(1);
    }
    if (!/[A-Z]/.test(password)) {
      console.error('❌ Password must contain at least one uppercase letter');
      process.exit(1);
    }
    if (!/[0-9]/.test(password)) {
      console.error('❌ Password must contain at least one number');
      process.exit(1);
    }

    // Check if user already exists
    const existing = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existing.rows.length > 0) {
      console.error(`❌ User ${email} already exists`);
      process.exit(1);
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'ADMIN')
       RETURNING id, email, role, created_at`,
      [email, hashedPassword]
    );

    const user = result.rows[0];
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('ID:', user.id);
    console.log('Created:', user.created_at);
    console.log('');
    console.log('You can now login at: http://localhost:3000/login');
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  } finally {
    await db.query('SELECT 1'); // Keep connection alive briefly
    process.exit(0);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node create-admin.js <email> <password>');
  console.log('Example: node create-admin.js admin@cvplatform.com Admin123!');
  process.exit(1);
}

const [email, password] = args;
createAdmin(email, password);
