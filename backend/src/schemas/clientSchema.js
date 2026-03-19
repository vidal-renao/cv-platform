const { z } = require("zod");

const createClientSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  address: z.string().optional()
});

module.exports = { createClientSchema };