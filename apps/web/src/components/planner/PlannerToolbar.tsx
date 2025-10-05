import React, { useEffect, useState, useMemo } from "react";
import { useCalendar } from "@/contexts/PlannerContext";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { WeekPicker } from "../ui/WeekPicker";
import { DateRangePicker } from "../ui/date-range-picker";
import { useData } from "@/contexts/PlannerDataContext";
import { useSearchParams } from "react-router-dom";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import {
  startOfWeek,
  endOfWeek,
  format,
  isSunday,
  isSaturday,
  parseISO,
} from "date-fns";
import AddScheduleDialog from "./AddScheuleDialog";
import { WorkSite } from "@/types/worksite";
import { Button } from "../ui/button";
import { X } from "lucide-react";

interface CalendarToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  filterEmployees: boolean;
  setFilterEmployees: (value: boolean) => void;
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  className,
  filterEmployees,
  setFilterEmployees,
  ...props
}) => {
  const { workSites, fetchSchedules } = useData();
  const { dateRange, setDateRange } = useCalendar();
  const [range, setRange] = useState<DateRange>({
    from: dateRange.from,
    to: dateRange.to,
  });
  const [selectedWorkSite, setSelectedWorkSite] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const stableDateRange = useMemo(
    () => ({
      from: dateRange.from,
      to: dateRange.to,
    }),
    [dateRange.from, dateRange.to]
  );

  const stableSelectedWorkSite = useMemo(
    () => selectedWorkSite,
    [selectedWorkSite]
  );

  const selectedWorksiteDetails = useMemo(() => {
    return workSites?.find((site) => site.id === selectedWorkSite);
  }, [workSites, selectedWorkSite]);

  useEffect(() => {
    const worksiteId = searchParams.get("workSite");
    const week = searchParams.get("week");

    if (worksiteId) {
      setSelectedWorkSite(Number(worksiteId));
    } else {
      setSelectedWorkSite(null);
    }

    if (week) {
      const weekDate = parseISO(week);

      let startOfWeekDate: Date;
      let endOfWeekDate: Date;

      if (isSunday(weekDate)) {
        startOfWeekDate = weekDate;
        endOfWeekDate = endOfWeek(weekDate, { weekStartsOn: 0 });
      } else if (isSaturday(weekDate)) {
        startOfWeekDate = startOfWeek(weekDate, { weekStartsOn: 0 });
        endOfWeekDate = weekDate;
      } else {
        startOfWeekDate = startOfWeek(weekDate, { weekStartsOn: 0 });
        endOfWeekDate = endOfWeek(weekDate, { weekStartsOn: 0 });
      }

      setRange({ from: startOfWeekDate, to: endOfWeekDate });
      setDateRange({ from: startOfWeekDate, to: endOfWeekDate });
    }
  }, [searchParams, setDateRange]);

  useEffect(() => {
    if (stableDateRange.from && stableDateRange.to) {
      fetchSchedules(
        { from: stableDateRange.from, to: stableDateRange.to },
        stableSelectedWorkSite
      );
    }
  }, [
    stableDateRange,
    stableSelectedWorkSite,
    filterEmployees,
    fetchSchedules,
  ]);

  const handleWorkSiteChange = (value: string) => {
    if (value === "none") {
      clearWorkSite();
      return;
    }
    const worksiteId = Number(value);
    setSelectedWorkSite(worksiteId);
    setSearchParams({
      workSite: worksiteId.toString(),
      week: searchParams.get("week") || "",
    });
  };

  const clearWorkSite = () => {
    setSelectedWorkSite(null);
    setSearchParams((prev) => {
      prev.delete("workSite");
      return prev;
    });
  };

  const handleWeekChange = (range: DateRange) => {
    if (range.from) {
      let startOfWeekDate: Date;
      let endOfWeekDate: Date;

      if (isSunday(range.from)) {
        startOfWeekDate = range.from;
        endOfWeekDate = endOfWeek(range.from, { weekStartsOn: 0 });
      } else if (isSaturday(range.from)) {
        startOfWeekDate = startOfWeek(range.from, { weekStartsOn: 0 });
        endOfWeekDate = range.from;
      } else {
        startOfWeekDate = startOfWeek(range.from, { weekStartsOn: 0 });
        endOfWeekDate = endOfWeek(range.from, { weekStartsOn: 0 });
      }

      setRange({ from: startOfWeekDate, to: endOfWeekDate });
      setDateRange({ from: startOfWeekDate, to: endOfWeekDate });

      setSearchParams((prev) => {
        prev.set("week", format(startOfWeekDate, "yyyy-MM-dd"));
        return prev;
      });
    }
  };

  const handleFilterEmployeesChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilterEmployees(event.target.checked);
  };

  return (
    <div
      className={cn("flex items-center justify-between w-full m-10", className)}
      {...props}
    >
      <div className="flex justify-end ml-4">
        <div className="flex">
          <AddScheduleDialog />
        </div>
        <div className="ml-10 flex items-center gap-2">
          <Select
            value={selectedWorkSite?.toString() || ""}
            onValueChange={handleWorkSiteChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a Worksite" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (All Worksites)</SelectItem>
              {workSites?.map((worksite: WorkSite) => (
                <SelectItem key={worksite.id} value={String(worksite.id)}>
                  {worksite.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedWorkSite && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearWorkSite}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {selectedWorksiteDetails && (
          <div className="pt-2 pl-2">
            <span className="font-medium">
              Viewing: {selectedWorksiteDetails.name}
            </span>
          </div>
        )}

        <div className="flex items-center ml-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filterEmployees}
              onChange={handleFilterEmployeesChange}
              className="mr-2"
            />
            See All Employees
          </label>
        </div>
      </div>

      <div className="flex justify-center">
        <WeekPicker
          onWeekChange={handleWeekChange}
          initialDateFrom={range.from}
          initialDateTo={range.to}
        />
      </div>

      <div className="flex justify-end">
        <DateRangePicker
          onUpdate={(value) => handleWeekChange(value.range)}
          initialDateFrom={range.from}
          initialDateTo={range.to}
          align="start"
          showCompare={false}
        />
      </div>
    </div>
  );
};

export default React.memo(CalendarToolbar);
