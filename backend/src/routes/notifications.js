const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications');
const { authenticateToken } = require('../middlewares/auth');

router.use(authenticateToken); // Protect all notification routes

router.get('/', notificationsController.getNotifications);

module.exports = router;
