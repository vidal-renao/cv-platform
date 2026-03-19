const express = require('express');
const router = express.Router();
const { sendContact } = require('../controllers/contact');

// Public — no auth
router.post('/', sendContact);

module.exports = router;
