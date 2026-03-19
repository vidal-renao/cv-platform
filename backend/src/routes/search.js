const express = require('express');
const router = express.Router();
const { search } = require('../controllers/search');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', authenticateToken, search);

module.exports = router;
