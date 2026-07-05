import { z } from 'zod';

// ─── Auth ──────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// ─── Clients ───────────────────────────────────────────────

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  full_name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
}).refine((data) => data.name || data.full_name, {
  message: 'Name is required',
  path: ['name'],
});

export const updateClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
});

// ─── Packages ──────────────────────────────────────────────

export const createPackageSchema = z.object({
  tracking_number: z.string().min(1, 'Tracking number is required'),
  client_id: z.string().uuid('Invalid client ID'),
  description: z.string().optional(),
  weight: z.union([z.string(), z.number()]).optional(),
});

export const updatePackageSchema = z.object({
  tracking_number: z.string().optional(),
  client_id: z.string().uuid('Invalid client ID').optional(),
  description: z.string().optional(),
  weight: z.union([z.string(), z.number()]).optional(),
});

export const packageStatusSchema = z.object({
  status: z.enum(['ARRIVED', 'READY_FOR_PICKUP', 'PICKED_UP'], 'Invalid status. Must be one of: ARRIVED, READY_FOR_PICKUP, PICKED_UP'),
});

// ─── Chat ──────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long (max 2000 chars)'),
});

// ─── Comments ──────────────────────────────────────────────

export const createCommentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment too long'),
  is_internal: z.boolean().optional(),
});

// ─── Users ─────────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'STAFF', 'CLIENT'], 'Invalid role'),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['SUPERADMIN', 'ADMIN', 'STAFF', 'CLIENT'], 'Invalid role'),
});

// ─── Settings ──────────────────────────────────────────────

export const updateSettingsSchema = z.object({
  currency_code: z.string().min(1, 'Currency code is required'),
  currency_symbol: z.string().min(1, 'Currency symbol is required'),
  cost_per_kg: z.number().min(0, 'Cost per kg must be non-negative'),
});

// ─── Validation helper ─────────────────────────────────────

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: { field: string; message: string }[] };

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    })),
  };
}
