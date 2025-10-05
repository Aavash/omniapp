import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/utils/fetchInterceptor";
import toast from "react-hot-toast";

type CallIn = {
  id: number;
  employee_id: number;
  title: string;
  date: string;
  shift_start: string;
  shift_end: string;
  remarks: string;
  worksite_id: number;
  called_in: boolean;
  call_in_reason: string;
  worksite_name: string;
  employee_full_name: string;
  day_of_week: string;
};

type Employee = {
  user_id: number;
  user_name: string;
  is_available: boolean;
  is_scheduled: boolean;
  available_start?: string;
  available_end?: string;
};

type AvailableEmployeesResponse = {
  employees: Employee[];
};

export default function DailyOverview() {
  const [date, setDate] = useState<Date>(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCallIn, setSelectedCallIn] = useState<CallIn | null>(null);
  const [selectedReplacement, setSelectedReplacement] = useState<number | null>(
    null
  );
  const [selectedReplacementName, setSelectedReplacementName] =
    useState<string>("");

  const {
    data: callInsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["shiftCallIns", date],
    queryFn: async () => {
      const dateString = format(date, "yyyy-MM-dd");
      const response = await fetchApi(`/api/shift/call-ins?date=${dateString}`);
      if (!response.ok) throw new Error("Failed to fetch call-ins");
      return response.json();
    },
  });

  const { data: availableEmployees, isLoading: isLoadingEmployees } =
    useQuery<AvailableEmployeesResponse>({
      queryKey: ["availableEmployees", selectedCallIn?.date],
      queryFn: async () => {
        if (!selectedCallIn) return { employees: [] };
        const response = await fetchApi(
          `/api/availability/available-employees?date=${selectedCallIn.date}`
        );
        if (!response.ok)
          throw new Error("Failed to fetch available employees");
        return response.json();
      },
      enabled: !!selectedCallIn,
    });

  const assignReplacementMutation = useMutation({
    mutationFn: async (replacementData: {
      original_shift_id: number;
      replacement_employee_id: number;
    }) => {
      const response = await fetchApi(
        `/api/shift/swap-employee/${replacementData.original_shift_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            replacement_employee_id: replacementData.replacement_employee_id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to assign replacement");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Replacement assigned successfully");
      setOpenDialog(false);
      setSelectedReplacement(null);
      setSelectedReplacementName("");
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to assign replacement");
    },
  });

  const handleFindReplacement = (callIn: CallIn) => {
    setSelectedCallIn(callIn);
    setSelectedReplacement(null);
    setSelectedReplacementName("");
    setOpenDialog(true);
  };

  const handleAssignReplacement = () => {
    if (!selectedReplacement || !selectedCallIn) {
      toast.error("Please select a replacement");
      return;
    }
    assignReplacementMutation.mutate({
      original_shift_id: selectedCallIn.id,
      replacement_employee_id: selectedReplacement,
    });
  };

  const handleSelectReplacement = (employee: Employee) => {
    setSelectedReplacement(employee.user_id);
    setSelectedReplacementName(employee.user_name);
  };

  const getShiftType = (startTime: string): string => {
    const hour = parseInt(startTime.split(":")[0]);
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Night";
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (error) return <div>Error: {(error as Error).message}</div>;

  const callIns = callInsData?.data || [];

  return (
    <div className="container mx-auto py-8">
      <Card className="border-red-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-red-50 rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-red-800">
            Daily Call-In Overview
          </CardTitle>
          <div className="flex items-center space-x-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-800 hover:bg-red-50"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-red-600" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {callIns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-red-400">
                No call-ins recorded for {format(date, "PPP")}
              </p>
            </div>
          ) : (
            <Table className="border-red-100">
              <TableHeader className="bg-red-50">
                <TableRow className="hover:bg-red-50">
                  <TableHead className="text-red-800">Employee</TableHead>
                  <TableHead className="text-red-800">Shift</TableHead>
                  <TableHead className="text-red-800">Worksite</TableHead>
                  <TableHead className="text-red-800">Time</TableHead>
                  <TableHead className="text-red-800">Reason</TableHead>
                  <TableHead className="text-right text-red-800">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callIns.map((callIn: CallIn) => (
                  <TableRow
                    key={callIn.id}
                    className="border-red-100 hover:bg-red-50"
                  >
                    <TableCell className="font-medium text-red-900">
                      {callIn.employee_full_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-red-300 text-red-800"
                      >
                        {getShiftType(callIn.shift_start)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-red-800">
                      {callIn.worksite_name}
                    </TableCell>
                    <TableCell className="text-red-800">
                      {callIn.shift_start} - {callIn.shift_end}
                    </TableCell>
                    <TableCell className="text-red-800">
                      {callIn.call_in_reason || "No reason provided"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleFindReplacement(callIn)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Find Replacement
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="border-red-200">
          <DialogHeader>
            <DialogTitle className="text-red-800">
              Find Replacement for {selectedCallIn?.employee_full_name}
            </DialogTitle>
            <DialogDescription>
              Date: {selectedCallIn?.date} ({selectedCallIn?.day_of_week})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-red-600 mb-2">
                Shift:{" "}
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  {selectedCallIn && getShiftType(selectedCallIn.shift_start)}
                </Badge>
              </p>
              <p className="text-sm text-red-600">
                Worksite: {selectedCallIn?.worksite_name}
              </p>
              <p className="text-sm text-red-600">
                Time: {selectedCallIn?.shift_start} -{" "}
                {selectedCallIn?.shift_end}
              </p>
            </div>

            {selectedReplacement && (
              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <p className="text-green-800 font-medium">
                  Selected Replacement: {selectedReplacementName}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-red-800">
                Available Employees (
                {availableEmployees?.employees?.length || 0})
              </label>
              {isLoadingEmployees ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </div>
              ) : (
                <div className="border rounded-lg border-gray-200 max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Available Hours</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableEmployees?.employees?.length || 0 > 0 ? (
                        availableEmployees?.employees.map((employee) => (
                          <TableRow key={employee.user_id}>
                            <TableCell>{employee.user_name}</TableCell>
                            <TableCell>
                              {employee.is_available ? (
                                <Badge className="bg-green-100 text-green-800">
                                  Available
                                </Badge>
                              ) : (
                                <Badge variant="outline">Unavailable</Badge>
                              )}
                              {employee.is_scheduled && (
                                <Badge variant="outline" className="ml-2">
                                  Scheduled
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {employee.available_start &&
                              employee.available_end ? (
                                `${employee.available_start} - ${employee.available_end}`
                              ) : (
                                <span className="text-gray-400">All day</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant={
                                  selectedReplacement === employee.user_id
                                    ? "default"
                                    : "outline"
                                }
                                className={
                                  selectedReplacement === employee.user_id
                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                    : "border-red-300 text-red-800 hover:bg-red-50"
                                }
                                onClick={() =>
                                  handleSelectReplacement(employee)
                                }
                                disabled={
                                  !employee.is_available ||
                                  employee.is_scheduled
                                }
                              >
                                {selectedReplacement === employee.user_id
                                  ? "Selected"
                                  : "Select"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-4 text-gray-500"
                          >
                            No available employees found for this date
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenDialog(false);
                  setSelectedReplacement(null);
                  setSelectedReplacementName("");
                }}
                className="border-red-300 text-red-800 hover:bg-red-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignReplacement}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={
                  !selectedReplacement || assignReplacementMutation.isPending
                }
              >
                {assignReplacementMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Assign Replacement"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
