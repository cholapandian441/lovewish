const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { getDb, initDb } = require('./database');

async function seed() {
  initDb();
  const db = getDb();

  const username = process.env.ADMIN_USERNAME;
  const plainPassword = process.env.ADMIN_PASSWORD;

  if (!username || !plainPassword) {
    console.error('ADMIN_USERNAME and ADMIN_PASSWORD must be set in backend/.env before seeding.');
    process.exit(1);
  }

  if (plainPassword.length < 12) {
    console.warn('⚠ Warning: ADMIN_PASSWORD is shorter than 12 characters. Use a strong password for production.');
  }

  // Check if admin already exists
  const existing = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(username);
  if (existing) {
    console.log(`Admin user "${username}" already exists. Skipping seed.`);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(plainPassword, 12);

  db.prepare('INSERT INTO admin_users (username, password) VALUES (?, ?)').run(username, hashed);

  console.log(`✓ Admin user "${username}" created successfully.`);
  console.log('  Use the credentials from your .env file to log in.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
