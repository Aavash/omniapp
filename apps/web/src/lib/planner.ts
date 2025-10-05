import { type ClassValue, clsx } from "clsx";
import {
  eachDayOfInterval,
  eachHourOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  differenceInDays,
  getWeekOfMonth,
  isSameDay,
  isSameMonth,
  isSameWeek,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { twMerge } from "tailwind-merge";
import { Schedule } from "@/models/Schedule";
import { isSameYear as dateFnsIsSameYear } from "date-fns";
import { Timeline } from "@/components/planner/Timeline";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const isSameYear = (date1: Date, date2: Date): boolean => {
  return dateFnsIsSameYear(date1, date2);
};

export const calculateNewDates = (
  viewMode: string,
  index: number,
  currentIndex: number,
  dateRange: { date: string; from: string; to: string } // Expects YYYY-MM-DD format
): { date: string; start: string; end: string } => {
  let start = new Date(`${dateRange.date}T${dateRange.from}:00`);
  let end = new Date(`${dateRange.date}T${dateRange.to}:00`);
  const delta = (currentIndex - index) * -1;

  switch (viewMode) {
    case "day":
      start.setHours(start.getHours() + delta);
      end.setHours(end.getHours() + delta);
      break;
    case "week":
      start.setDate(start.getDate() + delta);
      end.setDate(end.getDate() + delta);
      break;
    case "month":
      start.setMonth(start.getMonth() + delta);
      end.setMonth(end.getMonth() + delta);
      break;
    case "year":
      start.setFullYear(start.getFullYear() + delta);
      end.setFullYear(end.getFullYear() + delta);
      break;
  }

  // Format the date and times
  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  const formatTime = (date: Date) => date.toTimeString().slice(0, 5); // Extract HH:MM

  return {
    date: formatDate(start),
    start: formatTime(start),
    end: formatTime(end),
  };
};
export const filterSchedules = (
  schedule: Schedule,
  timeLabel: { label: string; date: string },
  index: number,
  dateRange: DateRange,
  viewMode: string
): boolean => {
  const shiftStart = new Date(`${schedule.date}T${schedule.shift_start}:00`);
  const shiftEnd = new Date(`${schedule.date}T${schedule.shift_end}:00`);
  if (!dateRange.from || !dateRange.to) return false;

  // Check if the shift overlaps with the date range
  const isShiftInRange =
    isWithinInterval(shiftStart, {
      start: dateRange.from,
      end: dateRange.to,
    }) ||
    isWithinInterval(shiftEnd, { start: dateRange.from, end: dateRange.to }) ||
    (shiftStart <= dateRange.from && shiftEnd >= dateRange.to);

  if (!isShiftInRange) {
    return false;
  }

  return isScheduleInSlot(
    shiftStart,
    shiftEnd,
    timeLabel,
    index,
    viewMode,
    dateRange
  );
};

const isScheduleInSlot = (
  shiftStart: Date,
  shiftEnd: Date,
  timeLabel: { label: string; date: string },
  index: number,
  viewMode: string,
  dateRange: DateRange
): boolean => {
  if (!dateRange.from) return false;

  switch (viewMode) {
    case "day":
      return (
        shiftStart.getHours() <= index &&
        shiftEnd.getHours() >= index &&
        isSameDay(shiftStart, dateRange.from)
      );
    case "week":
      const checkDate = shiftStart.toISOString().split("T")[0];
      return (
        checkDate == timeLabel.date && isSameWeek(shiftStart, dateRange.from)
      );
    case "month":
      return (
        getWeekOfMonth(shiftStart) <= index &&
        getWeekOfMonth(shiftEnd) >= index &&
        isSameMonth(shiftStart, dateRange.from)
      );
    case "year":
      return (
        shiftStart.getMonth() <= index &&
        shiftEnd.getMonth() >= index &&
        isSameYear(shiftStart, dateRange.from)
      );
    default:
      return false;
  }
};

export const getLabelsForView = (
  viewMode: "day" | "week" | "month" | "year",
  dateRange: { start: Date; end: Date }
): Array<{ label: string; date: string }> => {
  switch (viewMode) {
    case "day":
      // Generate hourly labels for each day in the range
      return eachHourOfInterval({
        start: startOfDay(dateRange.start),
        end: endOfDay(dateRange.end),
      }).map((hour) => ({
        label: format(hour, "HH:mm"),
        date: format(hour, "yyyy-MM-dd"),
      }));
    case "week":
      // Weekly labels based on the week number within the year
      return eachDayOfInterval({
        start: dateRange.start,
        end: dateRange.end,
      }).map((day) => ({
        label: `${format(day, "ccc")} the ${format(day, "do")}`,
        date: format(day, "yyyy-MM-dd"),
      }));
    case "month":
      // Monthly labels showing the full month name and year
      return eachWeekOfInterval({
        start: startOfMonth(dateRange.start),
        end: endOfMonth(dateRange.end),
      }).map((week) => ({
        label: `${format(week, "wo")} week in ${format(week, "MMM")}`,
        date: format(week, "yyyy-MM-dd"),
      }));
    case "year":
      // Yearly labels showing month names only
      return eachMonthOfInterval({
        start: startOfYear(dateRange.start),
        end: endOfYear(dateRange.end),
      }).map((month) => ({
        label: format(month, "MMM"),
        date: format(month, "yyyy-MM-dd"),
      }));
    default:
      return [];
  }
};
