require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const jwtSecret = process.env.JWT_SECRET;

// Fail fast: a missing or weak JWT secret means every issued token can be forged.
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error(
    'JWT_SECRET is missing or too short. Set a strong, random value (>= 32 chars) in your .env file. ' +
    'Generate one with:  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"'
  );
}

const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

// In production, refuse to start with default/weak admin credentials.
if (isProd) {
  const weakPasswords = ['admin', 'admin123', 'password', '123456', 'changeme'];
  if (!adminPassword || adminPassword.length < 12 || weakPasswords.includes(adminPassword.toLowerCase())) {
    throw new Error(
      'ADMIN_PASSWORD is missing or weak. In production it must be at least 12 characters and not a common password.'
    );
  }
}

module.exports = {
  isProd,
  port: process.env.PORT || 3000,
  jwtSecret,
  admin: {
    username: adminUsername,
    password: adminPassword,
  },
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:4200'],
  dbPath: './db/lovewish.db',
};
