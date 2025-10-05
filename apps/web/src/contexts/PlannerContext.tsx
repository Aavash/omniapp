import React, { createContext, useContext, useState, useMemo } from "react";
import { startOfWeek, endOfWeek } from "date-fns";
import { DateRange } from "react-day-picker";
import { getLabelsForView } from "@/lib/planner";

interface PlannerContextType {
  viewMode: "day" | "week" | "month" | "year";
  timeLabels: Array<{ label: string; date: string }>;
  dateRange: DateRange;
  currentDateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
}
const date = new Date();

const defaultContextValue: PlannerContextType = {
  viewMode: "week",
  timeLabels: [],
  dateRange: { from: startOfWeek(date), to: endOfWeek(date) },
  currentDateRange: {
    from: startOfWeek(date),
    to: endOfWeek(date),
  },
  setDateRange: (dateRange: DateRange) => {},
};

const PlannerContext = createContext<PlannerContextType>(defaultContextValue);

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfWeek(date),
    to: endOfWeek(date),
  });

  const viewMode = useMemo(() => {
    const days =
      (Number(dateRange.to) - Number(dateRange.from)) / (1000 * 3600 * 24);
    if (days < 1) return "day";
    if (days <= 7) return "week";
    if (days <= 31) return "month";
    return "year";
  }, [dateRange]);

  const timeLabels = useMemo(() => {
    return getLabelsForView(viewMode, {
      start: dateRange.from ?? startOfWeek(date),
      end: dateRange.to ?? endOfWeek(date),
    });
  }, [viewMode, dateRange]);

  const value = {
    timeLabels,
    dateRange,
    setDateRange,
    viewMode: viewMode as "day" | "week" | "month" | "year",
    currentDateRange: dateRange,
  };

  return (
    <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
  );
};

export const useCalendar = () => {
  return useContext(PlannerContext);
};
