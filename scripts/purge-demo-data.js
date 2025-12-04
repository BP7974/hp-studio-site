/*
 * Removes all user-facing data for a clean registration slate.
 */
const fs = require('fs');
const path = require('path');
const db = require('../lib/db');

function wipeTables() {
  db.exec(`
    DELETE FROM files;
    DELETE FROM password_resets;
    DELETE FROM verification_codes;
    DELETE FROM users;
    VACUUM;
  `);
}

function cleanUploads() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    return;
  }
  for (const entry of fs.readdirSync(uploadsDir)) {
    fs.rmSync(path.join(uploadsDir, entry), { recursive: true, force: true });
  }
}

function main() {
  wipeTables();
  cleanUploads();
  console.log('All registration data, tokens, and uploads have been cleared.');
}

main();
