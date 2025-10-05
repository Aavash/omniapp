import { useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Schedule, updateScheduleSchema } from "@/models/Schedule";
import { useData } from "@/contexts/PlannerDataContext";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, EllipsisVertical, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Calendar } from "../ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";

interface ScheduleEditProps {
  schedule: Schedule;
}

const EditSchedulePopOverForm = ({ schedule }: ScheduleEditProps) => {
  const { updateSchedule, removeSchedule, workSites = [] } = useData();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const form = useForm<z.infer<typeof updateScheduleSchema>>({
    resolver: zodResolver(updateScheduleSchema),
    defaultValues: {
      title: schedule?.title || "",
      date: schedule?.date || format(new Date(), "yyyy-MM-dd"),
      shift_start: schedule?.shift_start || "09:00",
      shift_end: schedule?.shift_end || "17:00",
      remarks: schedule?.remarks || "",
      worksite_id: schedule?.worksite_id?.toString() || "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof updateScheduleSchema>) => {
    try {
      const updatedSchedule: Schedule = {
        ...schedule,
        title: values.title,
        date: values.date,
        shift_start: values.shift_start,
        shift_end: values.shift_end,
        remarks: values.remarks || "",
        worksite_id: values.worksite_id ? Number(values.worksite_id) : null,
        employee_id: schedule.employee_id,
        id: schedule.id,
      };
      await updateSchedule(updatedSchedule);
      setIsPopoverOpen(false);
      toast.success("Schedule updated successfully!");
    } catch (error) {
      toast.error("Failed to update schedule.");
    }
  };

  const handleDelete = async () => {
    try {
      await removeSchedule(schedule.id || "");
      setIsPopoverOpen(false);
      toast.success("Schedule deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete schedule.");
    }
  };

  const parseDateWithoutTimezone = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[90vw] max-w-md p-4 max-h-[80vh] overflow-y-auto">
        <Card className="border-none p-0 shadow-none">
          <CardHeader className="p-0">
            <CardTitle className="text-sm sm:text-base">
              {schedule.title}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {schedule.date} {schedule.shift_start} - {schedule.shift_end}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <FormControl>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(
                                  parseDateWithoutTimezone(field.value),
                                  "PPP"
                                )
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                        </FormControl>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={
                              field.value
                                ? parseDateWithoutTimezone(field.value)
                                : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(format(date, "yyyy-MM-dd"));
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shift_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shift_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="worksite_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Worksite</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a worksite" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workSites?.map((worksite) => (
                            <SelectItem
                              key={worksite.id}
                              value={worksite.id?.toString() ?? ""}
                            >
                              {worksite.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Input placeholder="Remarks" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="submit">Update</Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
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
  );
};

export default EditSchedulePopOverForm;
