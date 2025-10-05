import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import toast from "react-hot-toast";
import {
  ShiftPreset,
  PresetGroup,
  createShiftPresetSchema,
} from "@/types/shift";
import { Employee } from "@/types/employee";
import { fetchApi } from "@/utils/fetchInterceptor";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreatePresetShiftFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  dayOfWeek: number;
  presetGroup: PresetGroup;
  employees: Employee[];
}

const createShiftPreset = async ({
  createData,
  preset_group_id,
}: {
  createData: Omit<ShiftPreset, "id">;
  preset_group_id: number;
}) => {
  const response = await fetchApi("/api/shift-preset/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...createData, preset_group_id }),
  });

  if (!response.ok) {
    throw new Error("Failed to create preset group");
  }
  return response.json();
};

export const CreatePresetShiftForm: React.FC<CreatePresetShiftFormProps> = ({
  isOpen,
  onOpenChange,
  employeeId,
  dayOfWeek,
  presetGroup,
  employees,
}) => {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof createShiftPresetSchema>>({
    resolver: zodResolver(createShiftPresetSchema),
    defaultValues: {
      title: "",
      day_of_week: dayOfWeek,
      shift_start: "09:00",
      shift_end: "17:00",
      remarks: "",
      employee_id: +employeeId,
    },
  });

  const createMutation = useMutation({
    mutationFn: createShiftPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-presets"] });
      onOpenChange(false);
      form.reset();
      toast.success("Shift preset added successfully!");
    },
    onError: () => toast.error("Failed to add shift preset."),
  });

  const handleSubmit = (values: z.infer<typeof createShiftPresetSchema>) => {
    const newPreset: Omit<ShiftPreset, "id"> = {
      ...values,
      remarks: values.remarks ?? "",
      employee_id: Number(values.employee_id),
      day_of_week: dayOfWeek,
    };

    createMutation.mutate({
      createData: newPreset,
      preset_group_id: presetGroup.id,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Shift Preset</DialogTitle>
          <DialogDescription>
            Fill out the form to add a new shift preset.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Employee Dropdown */}
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">
                    Employee
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={String(employeeId)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem
                          key={employee.id}
                          value={String(employee.id)}
                        >
                          {employee.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Title"
                      {...field}
                      className="text-sm sm:text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Day of the Week (Read-only) */}
            <FormItem>
              <FormLabel className="text-sm sm:text-base">
                Day of the Week
              </FormLabel>
              <Input
                value={daysOfWeek[dayOfWeek]}
                readOnly
                className="text-sm sm:text-base"
              />
            </FormItem>

            {/* Start Time */}
            <FormField
              control={form.control}
              name="shift_start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">
                    Start Time
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      step="3600"
                      {...field}
                      className="text-sm sm:text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Time */}
            <FormField
              control={form.control}
              name="shift_end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">
                    End Time
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      step="3600"
                      {...field}
                      className="text-sm sm:text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Worksite (Fixed Field) */}
            <FormItem>
              <FormLabel className="text-sm sm:text-base">Worksite</FormLabel>
              <FormControl>
                <Input
                  disabled
                  value={presetGroup.worksite_name}
                  readOnly
                  className="text-sm sm:text-base"
                />
              </FormControl>
            </FormItem>

            {/* Remarks */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">
                    Remarks
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Remarks"
                      {...field}
                      className="text-sm sm:text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" className="text-sm sm:text-base">
                Add Shift
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
