const express = require('express');
const router = express.Router();

const {
  getClients,
  getClientById,
  getClientProfile,
  createClient,
  updateClient,
  deleteClient,
  generateAccess,
  resendAccess,
} = require('../controllers/clients');

const { authenticateToken } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const { createClientSchema } = require('../schemas/clientSchema');

router.use(authenticateToken);

router.get('/', getClients);
router.get('/:id/profile', getClientProfile);
router.get('/:id', getClientById);
router.post('/', validateBody(createClientSchema), createClient);
router.put('/:id', validateBody(createClientSchema), updateClient);
router.delete('/:id', deleteClient);
router.post('/:id/generate-access', generateAccess);
router.post('/:id/resend-access', resendAccess);

module.exports = router;