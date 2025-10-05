import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/utils/fetchInterceptor";
import { CallInDialog } from "./CallInDialog";

// Types for API responses
type PunchStatusResponse = {
  isClockedIn: boolean;
  punchInTime: string | null;
  punchOutTime: string | null;
  totalWorkedHours: string | null;
};

type EmployeeDashboardData = {
  employeeInfo: {
    name: string;
    payrate: number;
    payType: string;
  };
  weeklyHours: {
    worked: number;
    scheduled: number;
    overtime: number;
  };
  monthlyHours: {
    worked: number;
    scheduled: number;
    overtime: number;
  };
  yearlyHours: {
    worked: number;
    scheduled: number;
    overtime: number;
  };
  notifications: {
    message: string;
    type: "info" | "warning" | "success";
  }[];
};

type WeeklyHistoryItem = {
  week_start: string;
  week_end: string;
  worked_hours: number;
  scheduled_hours: number;
  overtime_hours: number;
};

export type ShiftScheduleItem = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  called_in: boolean;
  status: string;
};

// API call functions
const punchInUser = async () => {
  const response = await fetchApi("/api/employee-user/punch-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error("Failed to punch in");
  return response.json();
};

const punchOutUser = async () => {
  const response = await fetchApi("/api/employee-user/punch-out", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error("Failed to punch out");
  return response.json();
};

const fetchPunchStatus = async (): Promise<PunchStatusResponse> => {
  const response = await fetchApi("/api/employee-user/punch-status");
  if (!response.ok) throw new Error("Failed to fetch punch status");
  return response.json();
};

const fetchDashboardData = async (): Promise<EmployeeDashboardData> => {
  const response = await fetchApi("/api/employee/dashboard");
  if (!response.ok) throw new Error("Failed to fetch dashboard data");
  return response.json();
};

const fetchWeeklyHistory = async (
  weeks: number
): Promise<WeeklyHistoryItem[]> => {
  const response = await fetchApi(
    `/api/employee/dashboard/weekly-history?weeks=${weeks}`
  );
  if (!response.ok) throw new Error("Failed to fetch weekly history");
  return response.json();
};

const fetchShiftSchedule = async (
  days: number
): Promise<ShiftScheduleItem[]> => {
  const response = await fetchApi(
    `/api/employee/dashboard/shift-schedule?days=${days}`
  );
  if (!response.ok) throw new Error("Failed to fetch shift schedule");
  return response.json();
};

const oneHourBeforeShift = (shift: ShiftScheduleItem | null): boolean => {
  if (!shift) return false;

  const now = new Date();
  const shiftDate = new Date(`${shift.date}T${shift.start_time}`);

  const timeDiff = shiftDate.getTime() - now.getTime();
  const oneHourInMs = 60 * 60 * 1000;
  return timeDiff < oneHourInMs;
};

export function EmployeeDashboard() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<string | null>(null);
  const [totalWorkedHours, setTotalWorkedHours] = useState<string | null>(null);
  const [weeksToShow, setWeeksToShow] = useState(12);
  const [daysToShow, setDaysToShow] = useState(14);

  // Fetch data
  const {
    data: punchStatus,
    isLoading: isPunchStatusLoading,
    isError: isPunchStatusError,
    refetch: refetchPunchStatus,
  } = useQuery({
    queryKey: ["punch-status"],
    queryFn: fetchPunchStatus,
  });

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
  } = useQuery({
    queryKey: ["employee-dashboard"],
    queryFn: fetchDashboardData,
  });

  const {
    data: weeklyHistory,
    isLoading: isWeeklyHistoryLoading,
    isError: isWeeklyHistoryError,
  } = useQuery({
    queryKey: ["weekly-history", weeksToShow],
    queryFn: () => fetchWeeklyHistory(weeksToShow),
  });

  const {
    data: shiftSchedule,
    isLoading: isShiftScheduleLoading,
    isError: isShiftScheduleError,
  } = useQuery({
    queryKey: ["shift-schedule", daysToShow],
    queryFn: () => fetchShiftSchedule(daysToShow),
  });

  // Update state when data changes
  useEffect(() => {
    if (punchStatus) {
      setIsClockedIn(punchStatus.isClockedIn);
      setPunchInTime(punchStatus.punchInTime);
      setPunchOutTime(punchStatus.punchOutTime);
      setTotalWorkedHours(punchStatus.totalWorkedHours);
    }
  }, [punchStatus]);

  // Punch in/out mutation
  const mutation = useMutation({
    mutationFn: (isClockedIn: boolean) =>
      isClockedIn ? punchOutUser() : punchInUser(),
    onSuccess: (data) => {
      setIsClockedIn(!isClockedIn);
      if (isClockedIn) {
        setPunchOutTime(data.punch_out_time);
      } else {
        setPunchInTime(data.punch_in_time);
      }
      refetchPunchStatus();
      alert(
        `Punch ${isClockedIn ? "out" : "in"} successful at ${
          isClockedIn ? data.punch_out_time : data.punch_in_time
        }`
      );
    },
    onError: (error) => {
      console.error("Error:", error);
      alert("Failed to update punch status. Please try again.");
    },
  });

  const handlePunchInOut = async () => {
    mutation.mutate(isClockedIn);
  };

  const getTodaysShift = (
    shiftSchedule: ShiftScheduleItem[] | undefined
  ): ShiftScheduleItem | null => {
    if (!shiftSchedule) return null;
    const today = new Date().toISOString().split("T")[0];
    return shiftSchedule.find((shift) => shift.date === today) || null;
  };

  // Calculate weekly progress
  const weeklyProgress = dashboardData
    ? (dashboardData.weeklyHours.worked / dashboardData.weeklyHours.scheduled) *
      100
    : 0;

  // Loading and error states
  if (
    isPunchStatusLoading ||
    isDashboardLoading ||
    isWeeklyHistoryLoading ||
    isShiftScheduleLoading
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading dashboard data...</div>
      </div>
    );
  }

  if (
    isPunchStatusError ||
    isDashboardError ||
    isWeeklyHistoryError ||
    isShiftScheduleError
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-500">
          Error loading dashboard data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Employee Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            View Schedule
          </Button>
        </div>
      </div>

      {/* Punch In/Out Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            {isClockedIn ? "You're Clocked In" : "You're Clocked Out"}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {isClockedIn
              ? "You're currently working. Don't forget to punch out!"
              : "Ready to start your day? Punch in now!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {punchInTime && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Punch In Time: {punchInTime}</span>
              </div>
            )}
            {punchOutTime && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span>Punch Out Time: {punchOutTime}</span>
              </div>
            )}
            {totalWorkedHours && (
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>
                  Total Worked Hours: {parseFloat(totalWorkedHours).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button
            onClick={handlePunchInOut}
            className="w-full md:w-48 bg-green-600 hover:bg-green-700 text-white"
            disabled={!!punchInTime || mutation.isPending}
          >
            {mutation.isPending ? "Processing..." : "Punch In"}
          </Button>
          <Button
            onClick={handlePunchInOut}
            className="w-full md:w-48 bg-red-600 hover:bg-red-700 text-white"
            disabled={!punchInTime || !!punchOutTime || mutation.isPending}
          >
            {mutation.isPending ? "Processing..." : "Punch Out"}
          </Button>
          <CallInDialog
            shift={getTodaysShift(shiftSchedule)}
            disabled={
              !getTodaysShift(shiftSchedule) ||
              getTodaysShift(shiftSchedule)?.called_in ||
              mutation.isPending
            }
          />
        </CardFooter>
      </Card>

      {/* Employee Information */}
      {dashboardData?.employeeInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-lg">{dashboardData.employeeInfo.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pay Rate</p>
                <p className="text-lg">
                  ${dashboardData.employeeInfo.payrate.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pay Type</p>
                <p className="text-lg">{dashboardData.employeeInfo.payType}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hours Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weekly Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">This Week</CardTitle>
            <CardDescription>
              {dashboardData?.weeklyHours.worked.toFixed(1)} hours worked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={weeklyProgress} className="h-2" />
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Scheduled:</span>
                <span>{dashboardData?.weeklyHours.scheduled.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Overtime:</span>
                <span className="text-orange-600">
                  {dashboardData?.weeklyHours.overtime.toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">This Month</CardTitle>
            <CardDescription>
              {dashboardData?.monthlyHours.worked.toFixed(1)} hours worked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Scheduled:</span>
                <span>{dashboardData?.monthlyHours.scheduled.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Overtime:</span>
                <span className="text-orange-600">
                  {dashboardData?.monthlyHours.overtime.toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">This Year</CardTitle>
            <CardDescription>
              {dashboardData?.yearlyHours.worked.toFixed(1)} hours worked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Scheduled:</span>
                <span>{dashboardData?.yearlyHours.scheduled.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Overtime:</span>
                <span className="text-orange-600">
                  {dashboardData?.yearlyHours.overtime.toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold">
                Weekly History
              </CardTitle>
              <CardDescription>
                Past {weeksToShow} weeks of work history
              </CardDescription>
            </div>
            <select
              value={weeksToShow}
              onChange={(e) => setWeeksToShow(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              <option value={4}>4 weeks</option>
              <option value={8}>8 weeks</option>
              <option value={12}>12 weeks</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyHistory?.map((week) => (
              <div key={week.week_start} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {new Date(week.week_start).toLocaleDateString()} -{" "}
                      {new Date(week.week_end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Worked: {week.worked_hours.toFixed(1)}h
                    </p>
                    <p className="text-sm text-gray-600">
                      Scheduled: {week.scheduled_hours.toFixed(1)}h
                    </p>
                    {week.overtime_hours > 0 && (
                      <p className="text-sm text-orange-600">
                        Overtime: {week.overtime_hours.toFixed(1)}h
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shift Schedule */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold">
                Upcoming Shifts
              </CardTitle>
              <CardDescription>
                Next {daysToShow} days of scheduled shifts
              </CardDescription>
            </div>
            <select
              value={daysToShow}
              onChange={(e) => setDaysToShow(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shiftSchedule?.map((shift) => (
              <div
                key={`${shift.date}-${shift.start_time}`}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {new Date(shift.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {shift.start_time} - {shift.end_time}
                    </p>
                    <p className="text-sm text-gray-600">{shift.location}</p>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        shift.status === "scheduled"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {shift.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {dashboardData?.notifications.map((notification, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                notification.type === "warning"
                  ? "bg-yellow-50 border-l-4 border-yellow-400"
                  : notification.type === "success"
                  ? "bg-green-50 border-l-4 border-green-400"
                  : "bg-blue-50 border-l-4 border-blue-400"
              }`}
            >
              {notification.type === "warning" ? (
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              ) : notification.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              )}
              <p className="text-sm">{notification.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default EmployeeDashboard;
