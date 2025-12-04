const path = require('path');
const Database = require('better-sqlite3');

const dbFile = path.join(process.cwd(), 'hpstudio.db');
const db = new Database(dbFile);

db.pragma('journal_mode = WAL');

function ensureUsersTableSchema() {
  const columns = db.prepare('PRAGMA table_info(users)').all();
  const emailColumn = columns.find((col) => col.name === 'email');
  const phoneColumn = columns.find((col) => col.name === 'phone');
  const needsMigration = Boolean(
    (emailColumn && emailColumn.notnull === 1) || (phoneColumn && phoneColumn.notnull === 1)
  );

  if (!needsMigration) {
    return;
  }

  const migrate = db.transaction(() => {
    db.exec('DROP TABLE IF EXISTS users__migration_backup');
    db.exec(`
      CREATE TABLE users__migration_backup (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    db.exec(`
      INSERT INTO users__migration_backup (id, name, email, phone, password_hash, created_at)
      SELECT id, name, email, phone, password_hash, created_at FROM users;
    `);
    db.exec('DROP TABLE users;');
    db.exec('ALTER TABLE users__migration_backup RENAME TO users;');
  });

  migrate();
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

ensureUsersTableSchema();

db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash
  ON password_resets(token_hash);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT NOT NULL CHECK(target_type IN ('email', 'phone')),
    target_value TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'register',
    code_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_verification_codes_lookup
  ON verification_codes(target_type, target_value, purpose, created_at DESC);
`);

module.exports = db;
