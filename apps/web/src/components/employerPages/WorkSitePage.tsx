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
import { fetchApi } from "@/utils/fetchInterceptor";
import WorkSiteListTable from "./WorkSiteListTable";
import CreateWorkSiteForm from "./CreateWorkSiteForm";
import EditWorkSiteForm from "./EditWorkSiteForm";

// Define the WorkSite type
type WorkSite = {
  id?: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  contact_person: string;
  contact_phone: string;
  status: "Active" | "Inactive";
};

// Fetch work sites from the API
const fetchWorkSites = async (
  page: number,
  perPage: number,
  searchQuery: string,
  sortBy: string,
  sortOrder: string
): Promise<WorkSite[]> => {
  const response = await fetchApi(
    `/api/worksite/list?page=${page}&per_page=${perPage}&search_query=${searchQuery}&sort_by=${sortBy}&sort_order=${sortOrder}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch work sites");
  }
  return response.json();
};

// Delete a work site
const deleteWorkSite = async (id: number): Promise<void> => {
  const response = await fetchApi(`/api/worksite/delete/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete work site");
  }
};

const WorkSitePage = () => {
  const queryClient = useQueryClient();
  const [selectedWorkSite, setSelectedWorkSite] = useState<WorkSite | null>(
    null
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10); // Default to 10 items per page
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTrigger, setSearchTrigger] = useState(0); // New state to trigger search

  // Fetch work sites using React Query
  const { data: workSites, isLoading } = useQuery({
    queryKey: ["workSites", page, perPage, searchTrigger, sortBy, sortOrder], // Use searchTrigger instead of searchQuery
    queryFn: () =>
      fetchWorkSites(page, perPage, searchQuery, sortBy, sortOrder),
  });

  // Delete work site mutation
  const deleteMutation = useMutation({
    mutationFn: deleteWorkSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workSites"] });
      toast.success("Work site deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete work site.");
    },
  });

  const handleDeleteWorkSite = (id: number) => {
    if (window.confirm("Are you sure you want to delete this work site?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSearch = () => {
    setPage(1); // Reset to the first page when searching
    setSearchTrigger((prev) => prev + 1); // Trigger the search
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
    setPerPage(Number(value)); // Update the number of items per page
    setPage(1); // Reset to the first page when changing perPage
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-screen w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Work Site Management</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Work Site
        </Button>
      </div>

      {/* Search Bar and Per Page Dropdown */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search work sites..."
          className="max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(); // Trigger search when Enter key is pressed
            }
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
        {/* Work Site Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Work Site List</CardTitle>
            <CardDescription>
              Manage your work sites and their details.
            </CardDescription>
          </CardHeader>
          <WorkSiteListTable
            setSelectedWorkSite={setSelectedWorkSite}
            workSites={workSites || []}
            setIsEditModalOpen={setIsEditModalOpen}
            handleDeleteWorkSite={handleDeleteWorkSite}
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

      {/* Create Work Site Modal */}
      <CreateWorkSiteForm
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
      />

      {/* Edit Work Site Modal */}
      <EditWorkSiteForm
        selectedWorkSite={selectedWorkSite}
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
      />

      <Toaster />
    </div>
  );
};

export default WorkSitePage;
