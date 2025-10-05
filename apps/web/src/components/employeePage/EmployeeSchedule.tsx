import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Schedule as ScheduleOrg } from "../../models/Schedule";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { fetchApi } from "@/utils/fetchInterceptor";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton component

interface Schedule extends ScheduleOrg {
  location: string;
  employee_punch_start: string | null;
  employee_punch_end: string | null;
}

// Helper function to get the start (Sunday) and end (Saturday) of the week for a given date
const getWeekRange = (date: Date) => {
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - date.getUTCDay()); // Set to Sunday in UTC
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6); // Set to Saturday in UTC
  return {
    start: start.toISOString().split("T")[0], // Use ISO string for UTC date
    end: end.toISOString().split("T")[0], // Use ISO string for UTC date
  };
};

// Helper function to get all dates in a week
const getWeekDates = (startDate: string) => {
  const dates = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i); // Use UTC date
    dates.push(date.toISOString().split("T")[0]); // Use ISO string for UTC date
  }
  return dates;
};

// Helper function to calculate total hours for the week
const calculateWeeklyHours = (schedules: Schedule[]) => {
  let totalHours = 0;
  schedules.forEach((schedule) => {
    const start = new Date(`1970-01-01T${schedule.shift_start}:00Z`); // Use UTC
    const end = new Date(`1970-01-01T${schedule.shift_end}:00Z`); // Use UTC
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert milliseconds to hours
    totalHours += duration;
  });
  return totalHours.toFixed(2); // Round to 2 decimal places
};

// Helper function to determine punch status
const getPunchStatus = (schedule: Schedule) => {
  const { employee_punch_start, employee_punch_end, date } = schedule;
  const currentDate = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format

  if (date > currentDate) {
    return "Upcoming"; // Future shift
  }

  if (employee_punch_start && employee_punch_end) {
    return "Clocked In";
  } else if (employee_punch_start && !employee_punch_end) {
    return "On Shift";
  } else if (!employee_punch_start && !employee_punch_end) {
    return "No Show"; // Past shift with no punches
  } else {
    return "Absent";
  }
};

// Helper function to calculate worked hours
const calculateWorkedHours = (schedule: Schedule) => {
  const { employee_punch_start, employee_punch_end } = schedule;

  if (employee_punch_start && employee_punch_end) {
    const start = new Date(`1970-01-01T${employee_punch_start}:00Z`); // Use UTC
    const end = new Date(`1970-01-01T${employee_punch_end}:00Z`); // Use UTC
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert milliseconds to hours
    return duration.toFixed(2); // Round to 2 decimal places
  }
  return "N/A"; // No worked hours if not clocked in/out
};

// Helper function to calculate shift duration in "Xh Ym" format
const calculateHours = (shift_start: string, shift_end: string) => {
  const start = new Date(`1970-01-01T${shift_start}:00Z`); // Use UTC
  const end = new Date(`1970-01-01T${shift_end}:00Z`); // Use UTC
  const diffMs = end.getTime() - start.getTime(); // Difference in milliseconds

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60)); // Hours
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)); // Minutes

  return `${diffHours}h ${diffMinutes}m`; // Format as "Xh Ym"
};

// Helper function to get row color based on punch status
const getRowColor = (status: string) => {
  switch (status) {
    case "Clocked In":
      return "bg-green-100"; // Light green for Clocked In
    case "On Shift":
      return "bg-blue-100"; // Light blue for On Shift
    case "No Show":
      return "bg-yellow-100"; // Light yellow for No Show
    case "Absent":
      return "bg-red-100"; // Light red for Absent
    case "Upcoming":
      return "bg-purple-100"; // Light purple for Upcoming
    default:
      return "";
  }
};

// Skeleton Loader Component
const TableSkeleton = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px]">
            <Skeleton className="h-4 w-full" />
          </TableHead>
          <TableHead className="w-[150px]">
            <Skeleton className="h-4 w-full" />
          </TableHead>
          <TableHead className="w-[200px]">
            <Skeleton className="h-4 w-full" />
          </TableHead>
          <TableHead className="w-[150px]">
            <Skeleton className="h-4 w-full" />
          </TableHead>
          <TableHead className="w-[150px]">
            <Skeleton className="h-4 w-full" />
          </TableHead>
          <TableHead className="w-[150px]">
            <Skeleton className="h-4 w-full" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 7 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export function EmployeeSchedule() {
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(
    getWeekRange(new Date())
  );
  const [weekDates, setWeekDates] = useState<string[]>(
    getWeekDates(dateRange.start)
  );

  // Fetch schedules using TanStack Query
  const {
    data: schedules = [],
    isLoading,
    isError,
  } = useQuery<Schedule[]>({
    queryKey: ["schedules", dateRange.start, dateRange.end],
    queryFn: async () => {
      const response = await fetchApi(
        `/api/employee-user/shifts?start_date=${dateRange.start}&end_date=${dateRange.end}`
      );
      if (!response.ok) {
        throw new Error("Error fetching employee information");
      }
      return response.json();
    },
  });

  // Update week dates when date range changes
  useEffect(() => {
    setWeekDates(getWeekDates(dateRange.start));
  }, [dateRange]);

  // Filter schedules by date range
  const filteredSchedules = schedules.filter((schedule) => {
    return schedule.date >= dateRange.start && schedule.date <= dateRange.end;
  });

  // Group schedules by date
  const groupedSchedules: { [key: string]: Schedule[] } = {};
  weekDates.forEach((date) => {
    groupedSchedules[date] = filteredSchedules.filter(
      (schedule) => schedule.date === date
    );
  });

  // Calculate total weekly hours
  const weeklyHours = calculateWeeklyHours(filteredSchedules);

  // Navigate to previous or next week
  const navigateWeek = (direction: "previous" | "next") => {
    const start = new Date(dateRange.start);
    if (direction === "previous") {
      start.setUTCDate(start.getUTCDate() - 7); // Use UTC date
    } else {
      start.setUTCDate(start.getUTCDate() + 7); // Use UTC date
    }
    setDateRange(getWeekRange(start));
  };

  // Handle date selection to navigate to a specific week
  const handleDateSelection = (date: string) => {
    const selectedDate = new Date(date);
    setDateRange(getWeekRange(selectedDate));
  };

  if (isError) return <div>Error fetching data</div>;

  return (
    <div className="flex flex-col h-screen w-full p-6 gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Schedule</h1>
      </div>
      <div className="text-lg font-semibold">
        Total Hours This Week:{" "}
        <span className="text-blue-600">{weeklyHours} hours</span>
      </div>
      {/* Table */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className=" p-5 rounded-t-lg border-b">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Title and Description */}
            <div className="text-center md:text-left">
              <CardTitle className="text-2xl font-bold text-gray-800">
                Weekly Schedule
              </CardTitle>
              <CardDescription className="text-gray-600">
                View and manage employee schedules for the week.
              </CardDescription>
            </div>

            {/* Filters and Navigation */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Week Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigateWeek("previous")}
                  variant="outline"
                  className="shadow-sm"
                >
                  &larr; Previous
                </Button>
                <Button
                  onClick={() => navigateWeek("next")}
                  variant="outline"
                  className="shadow-sm"
                >
                  Next &rarr;
                </Button>
              </div>

              {/* Date Picker and Reset */}
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateSelection(e.target.value)}
                  className="w-48 shadow-sm"
                />
                <Button
                  onClick={() => setDateRange(getWeekRange(new Date()))}
                  variant="outline"
                  className="shadow-sm"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-auto h-full p-6">
          {isLoading ? (
            <TableSkeleton /> // Show skeleton loader while loading
          ) : (
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead className="w-[150px]">Day</TableHead>
                  <TableHead className="w-[200px]">Schedule</TableHead>
                  <TableHead className="w-[150px]">Location</TableHead>
                  <TableHead className="w-[150px]">Punch Status</TableHead>
                  <TableHead className="w-[150px]">Worked Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekDates.map((date) => (
                  <TableRow
                    key={date}
                    className={getRowColor(
                      groupedSchedules[date]?.[0]
                        ? getPunchStatus(groupedSchedules[date][0])
                        : ""
                    )}
                  >
                    <TableCell className="font-medium truncate">
                      {new Date(date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC", // Ensure the date is displayed in UTC
                      })}
                    </TableCell>
                    <TableCell className="font-medium truncate">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        timeZone: "UTC", // Ensure the day is displayed in UTC
                      })}
                    </TableCell>
                    <TableCell className="truncate">
                      {groupedSchedules[date]?.length > 0 ? (
                        groupedSchedules[date].map((schedule) => (
                          <div key={schedule.id} className="mb-2">
                            <div className="font-medium truncate">
                              {schedule.title}
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                              {schedule.shift_start} - {schedule.shift_end}{" "}
                              {`(${calculateHours(
                                schedule.shift_start,
                                schedule.shift_end
                              )})`}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">No shifts scheduled</div>
                      )}
                     </TableCell>
                    <TableCell className="truncate">
                      {groupedSchedules[date]?.length > 0 ? (
                        groupedSchedules[date].map((schedule) => (
                          <div key={schedule.id} className="mb-2">
                            <div className="text-sm text-gray-600 truncate">
                              {schedule.worksite_name}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">N/A</div>
                      )}
                      </TableCell>
                   <TableCell className="truncate">
                      {groupedSchedules[date]?.length > 0 ? (
                        groupedSchedules[date].map((schedule) => (
                          <div key={schedule.id} className="mb-2">
                            <div className="font-medium truncate">
                              {schedule.employee_punch_start && schedule.employee_punch_end ? (
                                // If both punch start and punch end are available, show them in "startTime-endTime" format
                                `${schedule.employee_punch_start} - ${schedule.employee_punch_end}`
                              ) : (
                                getPunchStatus(schedule) // Fallback to punch status if times aren't available
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">No records found</div>
                      )}
                    </TableCell>

                    <TableCell className="truncate">
                      {groupedSchedules[date]?.length > 0 ? (
                        groupedSchedules[date].map((schedule) => (
                          <div key={schedule.id} className="mb-2">
                            <div className="font-medium truncate">
                              {calculateWorkedHours(schedule)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">N/A</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}

export default EmployeeSchedule;