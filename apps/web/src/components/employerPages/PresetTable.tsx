import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHeader,
  TableHead,
} from "../ui/table";
import { Employee } from "@/types/employee";
import { PresetGroup, ShiftPreset } from "@/types/shift";
import PresetScheduleCard from "./PresetScheduleCard";
import { Plus } from "lucide-react";
import { CreatePresetShiftForm } from "./CreatePresetShiftForm";

interface PresetTableProps {
  employees: Employee[];
  shiftPresets: ShiftPreset[];
  presetGroup: PresetGroup;
}

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const PresetTable: React.FC<PresetTableProps> = ({
  employees,
  shiftPresets,
  presetGroup,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number | null>(
    null
  );

  const handleAddClick = (employeeId: string, dayOfWeek: number) => {
    setSelectedEmployeeId(employeeId);
    setSelectedDayOfWeek(dayOfWeek);
    setIsAddDialogOpen(true); // Open the dialog
  };

  const employeePresetShifts = employees.map((employee) => {
    const shiftPresetsByDay = daysOfWeek.map((_, index) => {
      return shiftPresets.filter(
        (preset) =>
          preset.employee_id === employee.id && preset.day_of_week === index + 1
      );
    });

    return {
      employee,
      shiftPresetsByDay,
    };
  });

  return (
    <div className="flex flex-col h-[calc(80vh_-_theme(spacing.16))]">
      {/* Table Header - Fixed */}
      <div className="sticky top-0  bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium border border-gray-200 w-[200px]">
                Employee
              </TableHead>
              {daysOfWeek.map((day) => (
                <TableHead
                  key={day}
                  className="font-medium border border-gray-200 min-w-[150px]"
                >
                  {day}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Table Body - Scrollable */}
      <div className="flex-grow overflow-y-auto">
        <Table>
          <TableBody>
            {employeePresetShifts.map(({ employee, shiftPresetsByDay }) => (
              <TableRow key={employee.id}>
                <TableCell className="border border-gray-200 w-[200px]">
                  {employee.full_name}
                </TableCell>
                {shiftPresetsByDay.map((schedules, index) => (
                  <TableCell
                    key={`${employee.id}-${index}`}
                    className="border border-gray-200 min-w-[150px]"
                  >
                    {schedules.length > 0 ? (
                      schedules.map((preset) => (
                        <PresetScheduleCard
                          key={preset.id}
                          columnIndex={index}
                          shiftPreset={preset}
                          presetGroup={presetGroup}
                          employeeId={String(employee.id)}
                        />
                      ))
                    ) : (
                      <div
                        className="flex items-center justify-center h-full cursor-pointer"
                        onClick={() =>
                          handleAddClick(String(employee.id), index + 1)
                        }
                      >
                        <Plus className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Shift Preset Dialog */}
      {selectedEmployeeId && selectedDayOfWeek && (
        <CreatePresetShiftForm
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          employeeId={selectedEmployeeId}
          dayOfWeek={selectedDayOfWeek}
          presetGroup={presetGroup}
          employees={employees}
        />
      )}
    </div>
  );
};
