import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Schedule as AppointmentType } from "@/models/Schedule";

import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { calculateHours, cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

import EditSchedulePopOverForm from "./EditSchedulePopoverForm";
import { Clock, MapPin, Watch } from "lucide-react";

interface AppointmentProps {
  Schedule: AppointmentType;
  employeeId: string;
  columnIndex: number;
}

const Schedule: React.FC<AppointmentProps> = ({
  Schedule,
  employeeId,
  columnIndex,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  useEffect(() => {
    const element = ref.current!;
    return draggable({
      element,
      getInitialData: () => ({
        appointmentId: Schedule.id,
        columnIndex: columnIndex,
        employeeId: employeeId,
      }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, []);

  return (
    <Card ref={ref} className="hover:cursor-grab">
      <CardHeader className="flex flex-row items-center justify-between p-1">
        <Badge variant={"outline"} className="truncate pl-2 text-xs">
          {Schedule.title}
        </Badge>
        <EditSchedulePopOverForm schedule={Schedule} />
      </CardHeader>
      <CardContent
        className={cn("px-2 py-2", {
          "cursor-grabbing bg-muted opacity-50": isDragging,
        })}
      >
        <div className="flex flex-col gap-1 p-1 text-xs bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Location */}
          <div className="flex items-center gap-1 font-semibold text-blue-600">
            <MapPin className="w-3 h-3 text-blue-500" />
            <span>Location: {Schedule.worksite_name}</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1 font-semibold text-green-600">
            <Clock className="w-3 h-3 text-green-500" />
            <span>
              Time: {Schedule.shift_start} - {Schedule.shift_end}
            </span>
          </div>

          {/* Total Hours */}
          <div className="flex items-center gap-1 font-semibold text-purple-600">
            <Watch className="w-3 h-3 text-purple-500" />
            <span>
              Hours: {calculateHours(Schedule.shift_start, Schedule.shift_end)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Schedule;
