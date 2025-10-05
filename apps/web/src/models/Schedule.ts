import { z } from "zod";

export interface Schedule {
  id?: string;
  title: string;
  date: string;
  shift_start: string;
  shift_end: string;
  employee_id: string;
  worksite_id: string;
  worksite_name?: string;
  order?: number;
  remarks: string;
}

// Helper function to validate time in HH:MM format
const validateTimeFormat = (time: string) =>
  /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

// Helper function to validate date in YYYY-MM-DD format
const validateDateFormat = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);

export const updateScheduleSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(50, { message: "Title is too long" }),
  date: z.string().refine(validateDateFormat, {
    message: "Date must be in YYYY-MM-DD format",
  }),
  shift_start: z.string().refine(validateTimeFormat, {
    message: "Start time must be in HH:MM format",
  }),

  worksite_id: z.string().min(1, { message: "Worksite is required" }),
  shift_end: z.string().refine(validateTimeFormat, {
    message: "End time must be in HH:MM format",
  }),
  remarks: z.string().optional(),
});

export const createScheduleSchema = z
  .object({
    title: z
      .string()
      .min(1, { message: "Title is required" })
      .max(50, { message: "Title is too long" }),
    date: z.string().refine(validateDateFormat, {
      message: "Date must be in YYYY-MM-DD format",
    }),
    shift_start: z.string().refine(validateTimeFormat, {
      message: "Start time must be in HH:MM format",
    }),
    shift_end: z.string().refine(validateTimeFormat, {
      message: "End time must be in HH:MM format",
    }),
    employee_id: z.string().min(1, { message: "Employee ID is required" }),
    worksite_id: z.string().min(1, { message: "Worksite is required" }),
    order: z.number().optional(),
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
      path: ["end"],
    }
  );
