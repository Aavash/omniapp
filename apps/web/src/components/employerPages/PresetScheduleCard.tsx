import React from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Clock, MapPin, Watch } from "lucide-react";
import { calculateHours } from "@/lib/utils"; // Ensure this utility function is context-free
import PresetScheduleCardEdit from "./PresetScheduleCardEdit";
import { PresetGroup, ShiftPreset } from "@/types/shift";

interface AppointmentProps {
  shiftPreset: ShiftPreset;
  employeeId: string;
  columnIndex: number;
  presetGroup: PresetGroup;
}

const PresetScheduleCard: React.FC<AppointmentProps> = ({
  shiftPreset: shiftPreset,
  presetGroup,
}) => {
  return (
    <Card className="w-full hover:cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between p-2">
        <Badge variant={"outline"} className="truncate pl-2 text-xs">
          {shiftPreset.title}
        </Badge>
        <PresetScheduleCardEdit
          shiftPreset={shiftPreset}
          presetGroup={presetGroup}
        />
      </CardHeader>
      <CardContent className="px-2 py-2">
        <div className="flex flex-col gap-1 p-1 text-xs bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Location */}
          <div className="flex items-center gap-1 text-blue-600">
            <MapPin className="w-3 h-3 text-blue-500" />
            <span className="truncate">
              Location: {presetGroup.worksite_name}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1 text-green-600">
            <Clock className="w-3 h-3 text-green-500" />
            <span className="truncate">
              Time: {shiftPreset.shift_start} - {shiftPreset.shift_end}
            </span>
          </div>

          {/* Total Hours */}
          <div className="flex items-center gap-1 text-purple-600">
            <Watch className="w-3 h-3 text-purple-500" />
            <span className="truncate">
              Hours:{" "}
              {calculateHours(shiftPreset.shift_start, shiftPreset.shift_end)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PresetScheduleCard;
