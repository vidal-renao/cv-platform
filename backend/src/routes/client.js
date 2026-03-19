const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/client');
const { authenticateToken } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');

router.use(authenticateToken);
router.use(requireRole('CLIENT'));

router.get('/me', ctrl.getMe);
router.get('/packages', ctrl.getMyPackages);
router.get('/packages/:id', ctrl.getMyPackage);
router.get('/packages/:id/comments', ctrl.getMyPackageComments);
router.post('/packages/:id/comments', ctrl.addMyComment);
router.get('/packages/:id/proof', ctrl.getMyProof);

module.exports = router;
