const db = require('../db');

// GET /api/chat/contacts — staff/admins visible to current user for DMs
const getContacts = async (req, res, next) => {
  try {
    // Return all users except the caller (staff chat is for internal team)
    const result = await db.query(
      `SELECT u.id, u.email, u.role, u.last_seen,
              COUNT(m.id) FILTER (WHERE m.is_read = FALSE AND m.recipient_id = $1) AS unread
       FROM users u
       LEFT JOIN chat_messages m
         ON m.sender_id = u.id AND m.recipient_id = $1
       WHERE u.id <> $1
         AND u.role IN ('SUPERADMIN','ADMIN','STAFF')
       GROUP BY u.id
       ORDER BY u.role, u.email`,
      [req.user.id]
    );
    // Mark online (last_seen < 5 min)
    const THRESHOLD = 5 * 60 * 1000;
    const contacts = result.rows.map(c => ({
      ...c,
      unread: parseInt(c.unread, 10),
      is_online: c.last_seen ? Date.now() - new Date(c.last_seen).getTime() < THRESHOLD : false,
    }));
    res.json(contacts);
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/messages/:userId — conversation thread between caller and :userId
const getMessages = async (req, res, next) => {
  const { userId } = req.params;
  const me = req.user.id;
  try {
    const result = await db.query(
      `SELECT id, sender_id, recipient_id, content, is_read, created_at
       FROM chat_messages
       WHERE (sender_id = $1 AND recipient_id = $2)
          OR (sender_id = $2 AND recipient_id = $1)
       ORDER BY created_at ASC
       LIMIT 200`,
      [me, userId]
    );

    // Mark incoming messages as read
    await db.query(
      `UPDATE chat_messages SET is_read = TRUE
       WHERE sender_id = $1 AND recipient_id = $2 AND is_read = FALSE`,
      [userId, me]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/chat/messages — send a message
const sendMessage = async (req, res, next) => {
  const { recipientId, content } = req.body;

  if (!recipientId || !content?.trim()) {
    return res.status(400).json({ error: 'recipientId and content are required' });
  }
  if (content.trim().length > 2000) {
    return res.status(400).json({ error: 'Message too long (max 2000 chars)' });
  }
  if (recipientId === req.user.id) {
    return res.status(400).json({ error: 'Cannot send a message to yourself' });
  }

  try {
    // Verify recipient exists and is a team member
    const recipCheck = await db.query(
      `SELECT id FROM users WHERE id = $1 AND role IN ('SUPERADMIN','ADMIN','STAFF')`,
      [recipientId]
    );
    if (recipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const result = await db.query(
      `INSERT INTO chat_messages (sender_id, recipient_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, sender_id, recipient_id, content, is_read, created_at`,
      [req.user.id, recipientId, content.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/unread — total unread count for topbar badge
const getUnreadCount = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) AS total FROM chat_messages
       WHERE recipient_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    res.json({ unread: parseInt(result.rows[0].total, 10) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getContacts, getMessages, sendMessage, getUnreadCount };
