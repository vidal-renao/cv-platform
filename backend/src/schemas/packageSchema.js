const { z } = require('zod');

const createPackageSchema = z.object({
  tracking_number: z.string().min(1, 'Tracking number is required'),
  client_id: z.string().uuid('A valid client UUID is required'),
  description: z.string().optional(),
  weight: z.number().positive('Weight must be a positive number').optional(),
});

const updatePackageSchema = z.object({
  tracking_number: z.string().min(1).optional(),
  client_id: z.string().uuid().optional(),
  description: z.string().optional(),
  weight: z.number().positive('Weight must be a positive number').optional(),
});

module.exports = { createPackageSchema, updatePackageSchema };
