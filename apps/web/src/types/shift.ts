import { z } from "zod";

export type Analytics = {
  total_shift_hours: number;
  total_employees_scheduled: number;
};

export type Group = {
  id: number;
  title: string;
  worksite_id: number;
  worksite_name: string;
  organization_id: number;
  analytics: Analytics;
};

export type GroupResponse = {
  groups: Group[];
  total_groups: number;
  total_pages: number;
  current_page: number;
  per_page: number;
};

export type PresetGroup = {
  id: number;
  title: string;
  worksite_id: number;
  worksite_name: string;
  organization_id: number;
};

export interface ShiftPreset {
  id: number;
  employee_id: number;
  title: string;
  day_of_week: number;
  shift_start: string;
  shift_end: string;
  remarks: string;
}

// Helper function to validate time in HH:MM format
const validateTimeFormat = (time: string) =>
  /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

export const createShiftPresetSchema = z
  .object({
    title: z
      .string()
      .min(1, { message: "Title is required" })
      .max(50, { message: "Title is too long" }),
    day_of_week: z
      .number()
      .min(0, { message: "Day of week must be between 0 and 6" })
      .max(6, { message: "Day of week must be between 0 and 6" }),
    shift_start: z.string().refine(validateTimeFormat, {
      message: "Start time must be in HH:MM format",
    }),
    shift_end: z.string().refine(validateTimeFormat, {
      message: "End time must be in HH:MM format",
    }),
    employee_id: z.number().min(1, { message: "Employee ID is required" }),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => {
      const startTime = new Date(`1970-01-01T${data.shift_start}:00`);
      const endTime = new Date(`1970-01-01T${data.shift_end}:00`);
      return endTime > startTime;
    },
    {
      message: "End time must be after start time",
      path: ["shift_end"],
    }
  );

export const updateShiftPresetSchema = z
  .object({
    title: z
      .string()
      .min(1, { message: "Title is required" })
      .max(50, { message: "Title is too long" })
      .optional(),
    day_of_week: z
      .number()
      .min(0, { message: "Day of week must be between 0 and 6" })
      .max(6, { message: "Day of week must be between 0 and 6" })
      .optional(),
    shift_start: z
      .string()
      .refine(validateTimeFormat, {
        message: "Start time must be in HH:MM format",
      })
      .optional(),
    shift_end: z
      .string()
      .refine(validateTimeFormat, {
        message: "End time must be in HH:MM format",
      })
      .optional(),
    employee_id: z
      .number()
      .min(1, { message: "Employee ID is required" })
      .optional(),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.shift_start && data.shift_end) {
        const startTime = new Date(`1970-01-01T${data.shift_start}:00`);
        const endTime = new Date(`1970-01-01T${data.shift_end}:00`);
        return endTime > startTime;
      }
      return true; // If either shift_start or shift_end is missing, skip validation
    },
    {
      message: "End time must be after start time",
      path: ["shift_end"],
    }
  );
