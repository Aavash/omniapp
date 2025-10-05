import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Calendar,
  User,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Filter,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Toaster } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchApi } from "@/utils/fetchInterceptor";

const COLORS = ["#10B981", "#F59E0B", "#EF4444"];

interface MonthlySummary {
  total_employees: number;
  total_inactive_employees: number;
  total_hours: number;
  total_payments: number;
  total_absent: number;
  total_overtime: number;
  total_leave_hours: number;
  total_no_shows: number;
  payable_hours: number;
  average_hours_per_employee: number;
  weekly_hours: { week: string; hours: number }[];
  top_performers: {
    full_name: string;
    employee_id: number;
    total_hours: number;
    total_overtime: number;
  }[];
}

const fetchMonthlySummary = async (month: string): Promise<MonthlySummary> => {
  const response = await fetchApi(
    `/api/summary/monthly-worksite?month=${month}`
  );
  if (!response.ok) throw new Error("Failed to fetch monthly summary");
  return response.json();
};

export default function EmployerDashboard() {
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedMonth, setSelectedMonth] = useState("04");

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const combinedMonth = `${selectedYear}-${selectedMonth}`;

  const {
    data: monthlySummary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["monthlySummary", combinedMonth],
    queryFn: () => fetchMonthlySummary(combinedMonth),
  });

  const pieChartData = [
    { name: "Active", value: monthlySummary?.total_employees || 0 },
    { name: "Inactive", value: monthlySummary?.total_inactive_employees || 0 },
  ];

  if (error) return <div>Error loading data</div>;

  return (
    <>
      <Toaster />
      <div className="flex flex-col gap-6 p-6 h-screen w-full overflow-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Employee Dashboard</h1>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-500">Filter by:</span>
          </div>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  <User className="h-6 w-6 inline-block mr-2 text-blue-600" />
                  Total Employees
                </CardTitle>
                <CardDescription className="text-gray-600">
                  For {months.find((m) => m.value === selectedMonth)?.label}{" "}
                  {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {monthlySummary?.total_employees}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-teal-50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  <Clock className="h-6 w-6 inline-block mr-2 text-green-600" />
                  Total Hours Worked
                </CardTitle>
                <CardDescription className="text-gray-600">
                  For {months.find((m) => m.value === selectedMonth)?.label}{" "}
                  {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {monthlySummary?.total_hours} hours
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  <DollarSign className="h-6 w-6 inline-block mr-2 text-yellow-600" />
                  Total Payments
                </CardTitle>
                <CardDescription className="text-gray-600">
                  For {months.find((m) => m.value === selectedMonth)?.label}{" "}
                  {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {monthlySummary?.payable_hours
                    ? (monthlySummary.payable_hours * 17.5).toFixed(2)
                    : "0.00"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-50 to-pink-50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  <Calendar className="h-6 w-6 inline-block mr-2 text-red-600" />
                  Total Absent
                </CardTitle>
                <CardDescription className="text-gray-600">
                  For {months.find((m) => m.value === selectedMonth)?.label}{" "}
                  {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {monthlySummary?.total_no_shows} days
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  <AlertCircle className="h-6 w-6 inline-block mr-2 text-blue-600" />
                  Total Overtime
                </CardTitle>
                <CardDescription className="text-gray-600">
                  For {months.find((m) => m.value === selectedMonth)?.label}{" "}
                  {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {monthlySummary?.total_overtime} hours
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-50 to-pink-50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  <DollarSign className="h-6 w-6 inline-block mr-2 text-red-600" />
                  Payable Hours
                </CardTitle>
                <CardDescription className="text-gray-600">
                  For {months.find((m) => m.value === selectedMonth)?.label}{" "}
                  {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {monthlySummary?.payable_hours} hours
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  <TrendingUp className="h-6 w-6 inline-block mr-2 text-blue-600" />
                  Average Hours Per Employee
                </CardTitle>
                <CardDescription className="text-gray-600">
                  For {months.find((m) => m.value === selectedMonth)?.label}{" "}
                  {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {monthlySummary?.average_hours_per_employee.toFixed(2)} hours
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full mt-2" />
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  <User className="h-6 w-6 inline-block mr-2 text-green-600" />
                  Top Performers
                </CardTitle>
                <CardDescription className="text-gray-600">
                  For {months.find((m) => m.value === selectedMonth)?.label}{" "}
                  {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {monthlySummary?.top_performers.map((performer) => (
                    <li
                      key={performer.employee_id}
                      className="flex justify-between"
                    >
                      <span>{performer.full_name}</span>
                      <span className="font-medium">
                        {performer.total_hours} hours
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent className="h-[400px]">
                <Skeleton className="h-full w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent className="h-[400px]">
                <Skeleton className="h-full w-full" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Status</CardTitle>
                <CardDescription>
                  Distribution for{" "}
                  {months.find((m) => m.value === selectedMonth)?.label}{" "}
                  {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {pieChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Weekly Hours Worked -{" "}
                  {months.find((m) => m.value === selectedMonth)?.label}
                </CardTitle>
                <CardDescription>Breakdown by week</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySummary?.weekly_hours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hours" fill="#3B82F6" name="Total Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
