import React, { FC } from "react";
import { Employee } from "@/models";
import { cn } from "@/lib/utils";
import { TableCell } from "../ui/table";
import { Icons } from "../ui/icons";

export interface ResourceTableCellProps
  extends React.HTMLAttributes<HTMLTableCellElement> {
  employeeItem: Employee;
  totalHours: any;
}

const getHoursColor = (hours: number) => {
  if (hours > 40) return "text-red-500";
  if (hours >= 30 && hours <= 40) return "text-orange-500";
  return "text-green-500";
};

const ResourceTableCell: FC<ResourceTableCellProps> = ({
  className,
  employeeItem: resourceItem,
  totalHours,
  ...props
}) => {
  return (
    <TableCell
      className={cn(
        className,
        "sticky left-0 z-10 border-y bg-background " // Fixed minimum width
      )}
      {...props}
    >
      <div className="flex items-center space-x-4">
        <div className="relative h-10 w-10">
          <Icons.user size={24} />
        </div>
        <h2>{resourceItem.full_name}</h2>
        <TableCell className={`text-right ${getHoursColor(totalHours)}`}>
          {totalHours?.toFixed(2)} hours
        </TableCell>
      </div>
    </TableCell>
  );
};

export default ResourceTableCell;
