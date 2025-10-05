import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import CreateEmployeeForm from "./CreateEmployeeForm";
import EmployeeListTable from "./EmployeeListTable";
import { Employee } from "@/types/employee";
import EditEmployeeForm from "./EditEmployeeForm";
import { fetchApi } from "@/utils/fetchInterceptor";

const fetchEmployees = async (
  page: number,
  perPage: number,
  searchQuery: string,
  sortBy: string,
  sortOrder: string
): Promise<Employee[]> => {
  const response = await fetchApi(
    `/api/employee/list?page=${page}&per_page=${perPage}&search_query=${searchQuery}&sort_by=${sortBy}&sort_order=${sortOrder}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch employees");
  }
  return response.json();
};

const deleteEmployee = async (id: number): Promise<void> => {
  const response = await fetchApi(`/api/employee/delete/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete employee");
  }
};

const setEmployeeActiveStatus = async (
  id: number,
  is_active: boolean
): Promise<void> => {
  const response = await fetchApi(`/api/employee/user-status/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_active }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to ${is_active ? "activate" : "deactivate"} employee`
    );
  }
};

const EmployeePage = () => {
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTrigger, setSearchTrigger] = useState(0);

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees", page, perPage, searchTrigger, sortBy, sortOrder],
    queryFn: () =>
      fetchEmployees(page, perPage, searchQuery, sortBy, sortOrder),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete employee.");
    },
  });

  const activationMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      setEmployeeActiveStatus(id, is_active),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(
        `Employee ${
          variables.is_active ? "activated" : "deactivated"
        } successfully!`
      );
    },
    onError: (_, variables) => {
      toast.error(
        `Failed to ${variables.is_active ? "activate" : "deactivate"} employee.`
      );
    },
  });

  const handleDeleteEmployee = (id: number) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleActivation = (id: number, is_active: boolean) => {
    const action = is_active ? "activate" : "deactivate";
    if (window.confirm(`Are you sure you want to ${action} this employee?`)) {
      activationMutation.mutate({ id, is_active });
    }
  };

  const handleSearch = () => {
    setPage(1);
    setSearchTrigger((prev) => prev + 1);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value));
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-screen w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Employee Management</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Search Bar and Per Page Dropdown */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search employees..."
          className="max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <Button variant="outline" onClick={handleSearch}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
        Items per page:
        <Select onValueChange={handlePerPageChange} value={perPage.toString()}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Per Page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="lg:grid-cols-3 gap-6 flex-1">
        {/* Employee Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Employee List</CardTitle>
            <CardDescription>
              Manage your employees and their details.
            </CardDescription>
          </CardHeader>
          <EmployeeListTable
            setSelectedEmployee={setSelectedEmployee}
            employees={employees || []}
            setIsEditModalOpen={setIsEditModalOpen}
            handleDeleteEmployee={handleDeleteEmployee}
            handleActivation={handleActivation}
            handleSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        </Card>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <span>Page {page}</span>
        <Button variant="outline" onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </div>

      <CreateEmployeeForm
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
      />

      <EditEmployeeForm
        selectedEmployee={selectedEmployee}
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
      />

      <Toaster />
    </div>
  );
};

export default EmployeePage;
