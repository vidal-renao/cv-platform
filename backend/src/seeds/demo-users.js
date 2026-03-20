/**
 * Demo Seed Script
 * Creates 3 demo user accounts + sample chat messages for development and demo purposes.
 *
 * Usage:
 *   node src/seeds/demo-users.js
 *
 * Requires backend/.env to be configured with DATABASE_URL.
 * Run DB migration 002 first: psql $DATABASE_URL -f migrations/002_last_seen_and_chat.sql
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcrypt');
const db = require('../db');

const SALT_ROUNDS = 10;

const DEMO_USERS = [
  { email: 'admin@demo.ch',  password: 'demo1234', role: 'SUPERADMIN', label: 'SuperAdmin Demo' },
  { email: 'staff@demo.ch',  password: 'demo1234', role: 'STAFF',      label: 'Staff Demo' },
  { email: 'client@demo.ch', password: 'demo1234', role: 'CLIENT',     label: 'Client Demo' },
];

const DEMO_MESSAGES = [
  { fromLabel: 'SuperAdmin Demo', toLabel: 'Staff Demo', content: 'Buenos días! Todo listo para las entregas de hoy?' },
  { fromLabel: 'Staff Demo',      toLabel: 'SuperAdmin Demo', content: 'Sí, ya procesé los paquetes ARRIVED de la mañana.' },
  { fromLabel: 'SuperAdmin Demo', toLabel: 'Staff Demo', content: 'Perfecto. Recuerda notificar a los clientes cuando estén listos.' },
  { fromLabel: 'Staff Demo',      toLabel: 'SuperAdmin Demo', content: 'Entendido, lo haré ahora mismo.' },
];

async function seed() {
  console.log('\n🌱  CV Platform — Full Demo Seed\n');

  // ─── Create Users ──────────────────────────────────────────
  const createdIds = {};

  for (const user of DEMO_USERS) {
    try {
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [user.email]);
      if (existing.rows.length > 0) {
        createdIds[user.label] = existing.rows[0].id;
        console.log(`⚠️  ${user.label} (${user.email}) — already exists, skipping`);
        continue;
      }

      const hashed = await bcrypt.hash(user.password, SALT_ROUNDS);
      const result = await db.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
        [user.email, hashed, user.role]
      );
      createdIds[user.label] = result.rows[0].id;
      console.log(`✅  ${user.label} (${user.email}) — created  [role: ${user.role}]`);
    } catch (err) {
      console.error(`❌  ${user.label} (${user.email}) — error: ${err.message}`);
    }
  }

  // ─── Seed Chat Messages ────────────────────────────────────
  // Only if chat_messages table exists
  try {
    await db.query('SELECT 1 FROM chat_messages LIMIT 1');

    const existingMsgs = await db.query(
      `SELECT COUNT(*) FROM chat_messages
       WHERE sender_id = ANY($1::uuid[])`,
      [Object.values(createdIds).filter(Boolean)]
    );

    if (parseInt(existingMsgs.rows[0].count, 10) > 0) {
      console.log('\n⚠️  Demo chat messages already exist, skipping');
    } else {
      let msgsCreated = 0;
      for (const msg of DEMO_MESSAGES) {
        const senderId    = createdIds[msg.fromLabel];
        const recipientId = createdIds[msg.toLabel];
        if (!senderId || !recipientId) continue;
        try {
          await db.query(
            `INSERT INTO chat_messages (sender_id, recipient_id, content)
             VALUES ($1, $2, $3)`,
            [senderId, recipientId, msg.content]
          );
          msgsCreated++;
        } catch (err) {
          console.error(`❌  Chat message error: ${err.message}`);
        }
      }
      console.log(`\n✅  ${msgsCreated} demo chat messages created`);
    }
  } catch (_) {
    console.log('\n⚠️  chat_messages table not found — run migration 002 first');
  }

  // ─── Summary ───────────────────────────────────────────────
  console.log('\n📋  Demo credentials:\n');
  DEMO_USERS.forEach(u => {
    console.log(`   ${u.role.padEnd(12)} │ ${u.email.padEnd(20)} │ ${u.password}`);
  });
  console.log('\n✔   Seed complete.\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
