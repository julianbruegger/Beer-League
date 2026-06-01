const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "beer_league.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS beers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    base_points INTEGER NOT NULL,
    final_points INTEGER,
    status TEXT NOT NULL DEFAULT 'APPROVED',
    brand_name TEXT,
    location TEXT,
    notes TEXT,
    consumed_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    beer_id INTEGER NOT NULL REFERENCES beers(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    approve INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(beer_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS brand_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    brand TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, brand)
  );

  CREATE TABLE IF NOT EXISTS special_powers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    earner_id INTEGER NOT NULL REFERENCES users(id),
    target_id INTEGER REFERENCES users(id),
    power_type TEXT NOT NULL,
    point_deduction INTEGER NOT NULL,
    is_used INTEGER NOT NULL DEFAULT 0,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS point_deductions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_id INTEGER NOT NULL REFERENCES users(id),
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS monthly_awards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    award_type TEXT NOT NULL,
    points_awarded INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month, year, award_type)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expired DATETIME NOT NULL
  );
`);

module.exports = db;
