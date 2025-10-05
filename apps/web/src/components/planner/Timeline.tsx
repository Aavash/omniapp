import React from "react";
import { useCalendar } from "@/contexts/PlannerContext";
import { cn } from "@/lib/utils";
import { TableHead, TableHeader, TableRow } from "../ui/table";

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  columnWidth?: string; // Allow custom column width
  stickyHeader?: boolean; // Allow disabling sticky header
}

export const Timeline: React.FC<TimelineProps> = ({
  className,
  columnWidth = "min-w-[150px]", // Default column width
  stickyHeader = true, // Default to sticky header
  ...props
}) => {
  const { timeLabels } = useCalendar();

  return (
    <TableHeader>
      <TableRow className="bg-background">
        <TableHead></TableHead>
        {timeLabels.map((timeLabel, index) => (
          <TableHead
            key={index}
            className={cn(
              "bg-background border-x text-center",
              columnWidth, // Use dynamic column width
              stickyHeader && "sticky top-0 z-10" // Conditionally apply sticky
            )}
          >
            {timeLabel.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
};
