import { useState } from "react";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EllipsisVertical, Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
} from "@/components/ui/select";
import toast from "react-hot-toast";
import {
  PresetGroup,
  ShiftPreset,
  updateShiftPresetSchema,
} from "@/types/shift";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/utils/fetchInterceptor";

interface ShiftPresetEditProps {
  shiftPreset: ShiftPreset;
  presetGroup: PresetGroup;
}

// Update a shift preset
const updateShiftPreset = async (
  updatedShiftPreset: ShiftPreset,
  presetGroupId: number
) => {
  const response = await fetchApi(
    `/api/shift-preset/edit/${updatedShiftPreset.id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...updatedShiftPreset,
        preset_group_id: presetGroupId, // Include preset_group_id
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update shift preset");
  }

  return response.json();
};

// Delete a shift preset
const deleteShiftPreset = async (presetId: number) => {
  const response = await fetchApi(`/api/shift-preset/delete/${presetId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete shift preset");
  }

  return response.json();
};

const PresetShiftPresetCardEdit = ({
  shiftPreset,
  presetGroup,
}: ShiftPresetEditProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof updateShiftPresetSchema>>({
    resolver: zodResolver(updateShiftPresetSchema),
    defaultValues: {
      title: shiftPreset.title,
      day_of_week: shiftPreset.day_of_week,
      shift_start: shiftPreset.shift_start,
      shift_end: shiftPreset.shift_end,
      remarks: shiftPreset.remarks,
    },
  });

  // Mutation for updating a shift preset
  const updateMutation = useMutation({
    mutationFn: (updatedShiftPreset: ShiftPreset) =>
      updateShiftPreset(updatedShiftPreset, presetGroup.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-presets"] });
      setIsPopoverOpen(false);
      toast.success("Shift preset updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update shift preset.");
    },
  });

  // Mutation for deleting a shift preset
  const deleteMutation = useMutation({
    mutationFn: (presetId: number) => deleteShiftPreset(presetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift-presets"] });
      setIsDeleteDialogOpen(false);
      setIsPopoverOpen(false);
      toast.success("Shift preset deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete shift preset.");
    },
  });
  // Handle form submission for updating a shift preset
  const handleSubmit = async (
    values: z.infer<typeof updateShiftPresetSchema>
  ) => {
    const updatedShiftPreset = {
      ...shiftPreset,
      ...values,
    };
    updateMutation.mutate(updatedShiftPreset);
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    deleteMutation.mutate(shiftPreset.id);
  };

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              shift preset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Popover for Edit and Delete */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger>
          <div className="text-xs">
            <EllipsisVertical className="h-4 w-4" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[90vw] max-w-md p-4">
          <Card className="border-none p-0 shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="text-sm sm:text-base">
                {shiftPreset.title}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {shiftPreset.shift_start} - {shiftPreset.shift_end}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">
                          Title
                        </FormLabel>
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

                  {/* Day of the Week */}
                  <FormField
                    control={form.control}
                    name="day_of_week"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">
                          Day of the Week
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(Number(value))
                            }
                            value={String(field.value)}
                          >
                            <SelectTrigger className="text-sm sm:text-base">
                              <SelectValue placeholder="Select a day" />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                { value: 1, label: "Sunday" },
                                { value: 2, label: "Monday" },
                                { value: 3, label: "Tuesday" },
                                { value: 4, label: "Wednesday" },
                                { value: 5, label: "Thursday" },
                                { value: 6, label: "Friday" },
                                { value: 7, label: "Saturday" },
                              ].map((day) => (
                                <SelectItem
                                  key={day.value}
                                  value={String(day.value)}
                                  className="text-sm sm:text-base"
                                >
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                    <FormLabel className="text-sm sm:text-base">
                      Worksite
                    </FormLabel>
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

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="submit" className="text-sm sm:text-base">
                      Update
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-sm sm:text-base"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default PresetShiftPresetCardEdit;
