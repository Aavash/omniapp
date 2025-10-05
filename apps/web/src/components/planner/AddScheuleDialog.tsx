import React, { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createScheduleSchema, Schedule } from "@/models/Schedule";
import { useData } from "@/contexts/PlannerDataContext";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";

const AddScheduleDialog: React.FC = () => {
  const { addSchedule, employees, workSites } = useData();
  const [isOpened, setIsOpened] = useState(false);
  const [isPending, startAddScheduleTransition] = useTransition();
  const [backendError, setBackendError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof createScheduleSchema>>({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      employee_id: "",
      title: "",
      date: format(new Date(), "yyyy-MM-dd"),
      shift_start: "09:00",
      shift_end: "17:00",
      remarks: "",
      worksite_id: "",
    },
  });

  const selectedWorksiteId = form.watch("worksite_id");
  const selectedWorksite = workSites?.find(
    (worksite) => worksite.id === +selectedWorksiteId
  );

  function onSubmit(values: z.infer<typeof createScheduleSchema>) {
    const newSchedule: Schedule = {
      employee_id: values.employee_id,
      title: values.title,
      date: values.date,
      shift_start: values.shift_start,
      shift_end: values.shift_end,
      remarks: values.remarks || "",
      worksite_id: values.worksite_id,
    };

    setBackendError(null);

    startAddScheduleTransition(() => {
      toast.promise(
        addSchedule(newSchedule)
          .then(() => {
            form.reset();
            setTimeout(() => {
              setIsOpened(false);
            }, 1000);
          })
          .catch((error) => {
            setBackendError(error.message);
            throw new Error(error.message);
          }),
        {
          loading: "Adding schedule",
          success: "Schedule added",
          error: (err) => err.message,
        }
      );
    });
  }

  return (
    <Dialog open={isOpened} onOpenChange={setIsOpened}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Schedule</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <div className="p-1">
          <DialogHeader>
            <DialogTitle>Add Schedule</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {backendError && (
                <div className="text-sm font-medium text-destructive">
                  {backendError}
                </div>
              )}

              {selectedWorksite && (
                <div className="text-sm text-muted-foreground">
                  Location: {selectedWorksite.name}
                </div>
              )}

              <FormField
                control={form.control}
                name="worksite_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Worksite</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a worksite" />
                        </SelectTrigger>
                        <SelectContent>
                          {workSites?.map((worksite) => (
                            <SelectItem
                              key={worksite.id}
                              value={String(worksite.id)}
                            >
                              {worksite.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees?.map((employee) => (
                            <SelectItem
                              key={employee.id}
                              value={String(employee.id)}
                            >
                              {employee.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Schedule title" {...field} />
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
                              format(parseISO(field.value), "PPP")
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
                            field.value ? parseISO(field.value) : undefined
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shift_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift Start</FormLabel>
                      <FormControl>
                        <Input type="time" step="3600" {...field} />
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
                      <FormLabel>Shift End</FormLabel>
                      <FormControl>
                        <Input type="time" step="3600" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddScheduleDialog;
