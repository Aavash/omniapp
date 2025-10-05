import React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Employee } from "@/types/employee";
import { CardContent } from "../ui/card";
import { Button } from "../ui/button";

interface EmployeeListTableProps {
  employees: Employee[];
  setSelectedEmployee: (employee: Employee) => void;
  setIsEditModalOpen: (open: boolean) => void;
  handleDeleteEmployee: (id: number) => void;
  handleActivation: (id: number, is_active: boolean) => void; // Updated to handle both activate/deactivate
  handleSort: (column: string) => void;
  sortBy: string;
  sortOrder: string;
}

const EmployeeListTable: React.FC<EmployeeListTableProps> = ({
  employees,
  setSelectedEmployee,
  setIsEditModalOpen,
  handleDeleteEmployee,
  handleActivation, // Renamed from handleDeactivateEmployee
  handleSort,
  sortBy,
  sortOrder,
}) => {
  return (
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort("full_name")}>
              Name {sortBy === "full_name" && (sortOrder === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("email")}>
              Email {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Pay Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>{employee.full_name}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.phone_number}</TableCell>
              <TableCell>{employee.pay_type}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    employee.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {employee.is_active ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setIsEditModalOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant={employee.is_active ? "outline" : "secondary"}
                  size="sm"
                  className={
                    employee.is_active
                      ? "bg-yellow-100 text-yellow-800 hover:bg-orange-500"
                      : "bg-green-100 text-green-800 hover:bg-green-500"
                  }
                  onClick={() =>
                    handleActivation(employee.id!, !employee.is_active)
                  }
                >
                  {employee.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEmployee(employee.id!)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  );
};

export default EmployeeListTable;
