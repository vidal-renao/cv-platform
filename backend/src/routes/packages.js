const express = require('express');
const router = express.Router();

const packagesController = require('../controllers/packages');
const { getComments, addComment, deleteComment } = require('../controllers/comments');
const { saveProof, getProof } = require('../controllers/delivery');
const { authenticateToken } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const { validateBody } = require('../middlewares/validate');
const { createPackageSchema, updatePackageSchema } = require('../schemas/packageSchema');

router.use(authenticateToken);

// Operational roles — SUPERADMIN, ADMIN (legacy), STAFF
const OPS = ['SUPERADMIN', 'ADMIN', 'STAFF'];

// Package CRUD
router.get('/', requireRole(...OPS), packagesController.getPackages);
router.get('/client/:clientId', requireRole(...OPS), packagesController.getPackagesByClient);
router.post('/', requireRole(...OPS), validateBody(createPackageSchema), packagesController.createPackage);
router.put('/:id', requireRole(...OPS), validateBody(updatePackageSchema), packagesController.updatePackage);
router.patch('/:id/status', requireRole(...OPS), packagesController.updatePackageStatus);
router.post('/:id/pickup', requireRole(...OPS), packagesController.pickupPackage);

// Comments
router.get('/:id/comments', requireRole(...OPS), getComments);
router.post('/:id/comments', requireRole(...OPS), addComment);
router.delete('/:id/comments/:commentId', requireRole(...OPS), deleteComment);

// Delivery proof
router.post('/:id/proof', requireRole(...OPS), saveProof);
router.get('/:id/proof', getProof); // ADMIN, STAFF and CLIENT can view

module.exports = router;