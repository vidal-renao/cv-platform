const express = require('express');
const router = express.Router();
const { trackPackage } = require('../controllers/tracking');

// Public — no auth
router.get('/:trackingNumber', trackPackage);

module.exports = router;
