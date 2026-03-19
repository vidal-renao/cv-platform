const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const { authenticateToken } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');

// Only SUPERADMIN and ADMIN (legacy) can manage users — STAFF cannot
router.use(authenticateToken, requireRole('SUPERADMIN', 'ADMIN'));

router.get('/', usersController.listUsers);
router.patch('/:id/role', usersController.changeRole);

module.exports = router;
