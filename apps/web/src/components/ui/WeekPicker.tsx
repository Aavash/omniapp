import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";
import { addWeeks, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeekPickerProps {
  /** Initial start date of the range */
  initialDateFrom?: Date;
  /** Initial end date of the range */
  initialDateTo?: Date;
  /** Callback when the selected week changes */
  onWeekChange?: (range: { from: Date; to: Date }) => void;
  /** Alignment of the popover */
  align?: "start" | "center" | "end";
}

/**
 * A component to select and navigate through weeks.
 */
export const WeekPicker: React.FC<WeekPickerProps> = ({
  initialDateFrom = new Date(),
  initialDateTo,
  onWeekChange,
  align = "end",
}) => {
  // Initialize the selected week based on `initialDateFrom`
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(
    startOfWeek(initialDateFrom)
  );

  // Calculate the start and end of the selected week
  const selectedWeekRange = {
    from: selectedWeekStart,
    to: endOfWeek(selectedWeekStart),
  };

  // Update the selected week when `initialDateFrom` or `initialDateTo` changes
  useEffect(() => {
    if (initialDateFrom) {
      setSelectedWeekStart(startOfWeek(initialDateFrom));
    }
  }, [initialDateFrom]);

  const handleWeekChange = (direction: "prev" | "next") => {
    const newWeekStart = addWeeks(
      selectedWeekStart,
      direction === "prev" ? -1 : 1
    );
    setSelectedWeekStart(newWeekStart);
    onWeekChange?.({ from: newWeekStart, to: endOfWeek(newWeekStart) });
  };

  const handleSelectWeek = (date: Date | undefined) => {
    if (date) {
      const weekStart = startOfWeek(date);
      setSelectedWeekStart(weekStart);
      onWeekChange?.({ from: weekStart, to: endOfWeek(weekStart) });
      setIsOpen(false);
    }
  };

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Previous Week Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleWeekChange("prev")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Week Display and Calendar Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-center">
            {`Week of ${selectedWeekStart.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}`}
          </Button>
        </PopoverTrigger>
        <PopoverContent align={align} className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedWeekStart}
            onSelect={handleSelectWeek}
            initialFocus
            defaultMonth={selectedWeekStart}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>

      {/* Next Week Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleWeekChange("next")}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
