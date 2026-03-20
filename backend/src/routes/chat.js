const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat');
const { authenticateToken } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');

// Internal chat is restricted to operational team members only
router.use(authenticateToken, requireRole('SUPERADMIN', 'ADMIN', 'STAFF'));

router.get('/contacts',          chatController.getContacts);
router.get('/unread',            chatController.getUnreadCount);
router.get('/messages/:userId',  chatController.getMessages);
router.post('/messages',         chatController.sendMessage);

module.exports = router;
