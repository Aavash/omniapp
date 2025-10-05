import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Clock, UserCheck, UserX } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import EmployeeHoursTable from "./EmployeeHoursTable";

// Mock data for attendance
const attendanceData = [
  {
    id: 1,
    employeeName: "John Doe",
    shift: "9:00 AM - 5:00 PM",
    date: "2023-10-01",
    status: "Present",
  },
  {
    id: 2,
    employeeName: "Jane Smith",
    shift: "9:00 AM - 5:00 PM",
    date: "2023-10-01",
    status: "Absent",
  },
  {
    id: 3,
    employeeName: "Alice Johnson",
    shift: "12:00 PM - 8:00 PM",
    date: "2023-10-01",
    status: "Late",
  },
  {
    id: 4,
    employeeName: "Bob Brown",
    shift: "9:00 AM - 5:00 PM",
    date: "2023-10-01",
    status: "Present",
  },
];

// Mock data for attendance trends
const attendanceTrendsData = [
  { month: "Jan", present: 120, absent: 10, late: 5 },
  { month: "Feb", present: 130, absent: 8, late: 7 },
  { month: "Mar", present: 140, absent: 5, late: 3 },
  { month: "Apr", present: 150, absent: 3, late: 2 },
  { month: "May", present: 160, absent: 2, late: 1 },
];

export default function EmployerAttendancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Calculate statistics
  const totalEmployees = attendanceData.length;
  const presentCount = attendanceData.filter(
    (a) => a.status === "Present"
  ).length;
  const absentCount = attendanceData.filter(
    (a) => a.status === "Absent"
  ).length;
  const lateCount = attendanceData.filter((a) => a.status === "Late").length;

  // Filtered attendance data
  const filteredAttendance = attendanceData.filter(
    (a) =>
      a.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filterDate ? a.date === filterDate : true)
  );

  return (
    <div className="flex flex-col gap-6 p-6 h-screen w-full overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold"> Weekly Attended hours Record</h1>
        {/* <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button> */}
      </div>

 {/* Employee Hours Table Section */}
 <div className="mb-8">
          <EmployeeHoursTable />
        </div>
     
    </div>
  );
}
