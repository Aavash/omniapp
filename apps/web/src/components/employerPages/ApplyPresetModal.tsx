import {
  format,
  isSameWeek,
  startOfWeek,
  endOfWeek,
  isSameDay,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/utils/fetchInterceptor";
import toast from "react-hot-toast";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PresetGroup } from "@/types/shift";
import { Employee } from "@/types/employee";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ApplyPresetModalProps {
  employees: Employee[];
  presetGroupId: string;
  presetGroupDetails: PresetGroup;
  selectedWeek: { from: Date; to: Date } | undefined;
  setSelectedWeek: (week: { from: Date; to: Date } | undefined) => void;
  navigate: (path: string) => void;
}

export default function ApplyPresetModal({
  employees,
  presetGroupId,
  presetGroupDetails,
  selectedWeek,
  setSelectedWeek,
  navigate,
}: ApplyPresetModalProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<
    Set<number | undefined>
  >(new Set(employees.map((emp) => emp.id)));
  const [selectionMode, setSelectionMode] = useState<"week" | "days">("week");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const toggleEmployee = (employeeId: number | undefined) => {
    setSelectedEmployees((prev) => {
      const newSet = new Set(prev);
      newSet.has(employeeId)
        ? newSet.delete(employeeId)
        : newSet.add(employeeId);
      return newSet;
    });
  };

  const toggleAllEmployees = (checked: boolean) => {
    setSelectedEmployees(
      checked ? new Set(employees.map((emp) => emp.id)) : new Set()
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (selectionMode === "week") {
      setSelectedWeek({
        from: startOfWeek(date, { weekStartsOn: 0 }),
        to: endOfWeek(date, { weekStartsOn: 0 }),
      });
      setSelectedDates([]);
    } else {
      setSelectedDates((prev) => {
        const existingIndex = prev.findIndex((d) => isSameDay(d, date));
        if (existingIndex >= 0) {
          return prev.filter((_, i) => i !== existingIndex);
        }
        return [...prev, date];
      });
      setSelectedWeek(undefined);
    }
  };

  const applyPreset = async ({
    presetGroupId,
    dates,
    isWeekly,
  }: {
    presetGroupId: string;
    dates: string[];
    isWeekly: boolean;
  }) => {
    const response = await fetchApi("/api/shift-preset/populate-shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preset_group_id: presetGroupId,
        dates,
        employee_ids: Array.from(selectedEmployees) as number[],
        apply_to_week: isWeekly,
      }),
    });
    if (!response.ok) throw new Error("Failed to apply preset");
    return response.json();
  };

  const applyPresetMutation = useMutation({
    mutationFn: applyPreset,
    onSuccess: (data, variables) => {
      toast.success("Preset applied successfully");
      navigate(`/schedule?workSite=${presetGroupDetails.worksite_id}`);
    },
    onError: (error) => {
      toast.error("Failed to apply preset");
      console.error("Error applying preset:", error);
    },
  });

  const handleApplyPreset = async () => {
    if (selectionMode === "week" && !selectedWeek) {
      toast.error("Please select a week");
      return;
    }
    if (selectionMode === "days" && selectedDates.length === 0) {
      toast.error("Please select at least one date");
      return;
    }
    if (selectedEmployees.size === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    const dates =
      selectionMode === "week"
        ? [format(selectedWeek!.from, "yyyy-MM-dd")]
        : selectedDates.map((date) => format(date, "yyyy-MM-dd"));

    applyPresetMutation.mutate({
      presetGroupId,
      dates,
      isWeekly: selectionMode === "week",
    });
  };

  const modifiers = {
    selectedWeek: (date: Date) =>
      selectionMode === "week" && selectedWeek
        ? isSameWeek(date, selectedWeek.from, { weekStartsOn: 0 })
        : false,
    selectedDays: (date: Date) =>
      selectionMode === "days"
        ? selectedDates.some((d) => isSameDay(d, date))
        : false,
  };

  const modifiersStyles = {
    selectedWeek: {
      backgroundColor: "#f0f9ff",
      border: "1px solid #bae6fd",
      borderRadius: "6px",
      color: "#0369a1",
    },
    selectedDays: {
      backgroundColor: "#38bdf8",
      color: "white",
      borderRadius: "6px",
      fontWeight: "600",
    },
  };

  return (
    <DialogContent className="max-w-md sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Apply Preset Schedule</DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="block mb-2 font-medium">
            Employees ({selectedEmployees.size} selected)
          </Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                id="selectAll"
                checked={selectedEmployees.size === employees.length}
                onCheckedChange={toggleAllEmployees}
              />
              <Label htmlFor="selectAll" className="font-medium">
                Select All Employees
              </Label>
            </div>
            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50"
                >
                  <Checkbox
                    id={`employee-${employee.id}`}
                    checked={selectedEmployees.has(employee.id)}
                    onCheckedChange={() => toggleEmployee(employee.id)}
                  />
                  <Label htmlFor={`employee-${employee.id}`} className="flex-1">
                    {employee.full_name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="block mb-2 font-medium">Date Selection</Label>
          <RadioGroup
            defaultValue="week"
            className="flex gap-4 mb-4"
            onValueChange={(value) =>
              setSelectionMode(value as "week" | "days")
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="week" id="week-mode" />
              <Label htmlFor="week-mode">Entire Week</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="days" id="days-mode" />
              <Label htmlFor="days-mode">Multiple Days</Label>
            </div>
          </RadioGroup>

          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={
                selectionMode === "week" ? selectedWeek?.from : undefined
              }
              onSelect={handleDateSelect}
              numberOfMonths={1}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border p-3 bg-white shadow-sm"
            />
          </div>

          {selectionMode === "week" && selectedWeek && (
            <p className="text-sm text-center mt-2 text-gray-600">
              Selected Week: {format(selectedWeek.from, "MMM dd, yyyy")} -{" "}
              {format(selectedWeek.to, "MMM dd, yyyy")}
            </p>
          )}
          {selectionMode === "days" && selectedDates.length > 0 && (
            <div className="text-sm text-center mt-2">
              <p className="text-gray-600 mb-1">Selected Days:</p>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {selectedDates.map((date) => (
                  <span
                    key={date.toString()}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {format(date, "MMM dd")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleApplyPreset}
          disabled={applyPresetMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {applyPresetMutation.isPending ? "Applying..." : "Apply Preset"}
        </Button>
      </div>
    </DialogContent>
  );
}
