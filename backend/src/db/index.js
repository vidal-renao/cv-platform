const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log("✅ DB pool initialized");

module.exports = {
  query: (text, params) => pool.query(text, params),
};