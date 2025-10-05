import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/utils/fetchInterceptor";

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

// Helper function to format numbers to 2 decimal places
const formatNumber = (num: any) => {
  // Convert the input to a number (if it's a string)
  const parsedNum = typeof num === "string" ? parseFloat(num) : num;

  // If the input is not a number, return 0
  if (typeof parsedNum !== "number" || isNaN(parsedNum)) {
    return 0;
  }

  // Format the number to 2 decimal places
  return parseFloat(parsedNum.toFixed(2));
};

const EmployeeHoursTable = () => {
  const [dateRange, setDateRange] = useState(getWeekRange(new Date()));

  // Fetch employee hours summary using TanStack Query
  const {
    data: employeeHours = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["employee-hours-summary", dateRange.start, dateRange.end],
    queryFn: async () => {
      const response = await fetchApi(
        `/api/employee-hours/summary?week_start=${dateRange.start}&week_end=${dateRange.end}`
      );
      if (!response.ok) throw new Error("Failed to fetch employee hours summary");

      // Log the API response for debugging
      const data = await response.json();
      console.log("API Response:", data);
      return data;
    },
  });

  // Calculate the total hours, worked hours, and overtime hours
  const totalHoursScheduled = formatNumber(
    employeeHours.reduce((acc, item) => acc + formatNumber(item.scheduled_hours), 0)
  );
  const totalHoursWorked = formatNumber(
    employeeHours.reduce((acc, item) => acc + formatNumber(item.worked_hours), 0)
  );
  const totalOvertimeHours = formatNumber(
    employeeHours.reduce((acc, item) => acc + formatNumber(item.overtime_hours), 0)
  );

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

  return (
    <Card className="mb-6">
      {/* Card Header */}
      <CardHeader>
        <CardTitle className="text-lg md:text-xl font-semibold">
          Employee Weekly Scheduled Hours
        </CardTitle>
        {/* Calendar Navigation */}
        <div className="flex items-center gap-4 mt-4">
          <Button
            onClick={() => navigateWeek("previous")}
            variant="outline"
            className="shadow-sm"
          >
            &larr; Previous
          </Button>
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => handleDateSelection(e.target.value)}
            className="w-48 shadow-sm"
          />
          <Button
            onClick={() => navigateWeek("next")}
            variant="outline"
            className="shadow-sm"
          >
            Next &rarr;
          </Button>
        </div>
      </CardHeader>

      {/* Card Content */}
      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-4">Loading employee hours...</div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-4 text-red-500">
            Failed to fetch employee hours. Please try again.
          </div>
        )}

        {/* Table Section */}
        {!isLoading && !isError && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Scheduled Hours</TableHead>
                  <TableHead>Worked Hours</TableHead>
                  <TableHead>Overtime Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeHours.length > 0 ? (
                  employeeHours.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.employee.name}</TableCell>
                      <TableCell>{formatNumber(item.scheduled_hours)}</TableCell>
                      <TableCell>{formatNumber(item.worked_hours)}</TableCell>
                      <TableCell
                        className={`${
                          item.overtime_hours > 0 ? "text-red-500" : "text-gray-900"
                        }`}
                      >
                        {formatNumber(item.overtime_hours)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No data available for the selected week.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Summary Section in Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Hours Scheduled Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    Total Hours Scheduled
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalHoursScheduled}</p>
                </CardContent>
              </Card>

              {/* Total Hours Worked Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    Total Hours Worked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalHoursWorked}</p>
                </CardContent>
              </Card>

              {/* Total Overtime Hours Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    Total Overtime Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totalOvertimeHours}</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeHoursTable;