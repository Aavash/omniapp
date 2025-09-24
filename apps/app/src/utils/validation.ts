import { z } from 'zod';
import { VALIDATION } from './constants';

// Base validation schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(VALIDATION.MAX_EMAIL_LENGTH, 'Email is too long')
  .regex(VALIDATION.EMAIL_REGEX, 'Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(VALIDATION.MIN_PASSWORD_LENGTH, `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`)
  .max(100, 'Password is too long');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(VALIDATION.MAX_NAME_LENGTH, 'Name is too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (phone) => !phone || VALIDATION.PHONE_REGEX.test(phone),
    'Please enter a valid phone number'
  );

// Auth validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

// Profile validation schemas
export const updateProfileSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  phone: phoneSchema,
  address: z.string().max(200, 'Address is too long').optional(),
});

// Time tracking validation schemas
export const punchSchema = z.object({
  type: z.enum(['in', 'out', 'break_start', 'break_end']),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

// Availability validation schemas
export const availabilitySchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  is_available: z.boolean(),
});

// Date range validation schema
export const dateRangeSchema = z
  .object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  })
  .refine((data) => new Date(data.start_date) <= new Date(data.end_date), {
    message: 'End date must be after start date',
    path: ['end_date'],
  });

// Report filters validation schema
export const reportFiltersSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  employee_ids: z.array(z.number()).optional(),
  department: z.string().optional(),
  report_type: z.enum(['payroll', 'attendance', 'hours', 'performance']),
});

// Type exports for form validation
export type LoginFormData = z.infer<typeof loginSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type PunchFormData = z.infer<typeof punchSchema>;
export type AvailabilityFormData = z.infer<typeof availabilitySchema>;
export type DateRangeFormData = z.infer<typeof dateRangeSchema>;
export type ReportFiltersFormData = z.infer<typeof reportFiltersSchema>;

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

export const validatePassword = (password: string): boolean => {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
};

export const validatePhone = (phone: string): boolean => {
  try {
    phoneSchema.parse(phone);
    return true;
  } catch {
    return false;
  }
};

export const getValidationErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
};