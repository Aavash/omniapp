import { WorkSite } from "@/types/worksite";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useNavigate } from "react-router-dom";

interface WorkSiteListTableProps {
  workSites: WorkSite[];
  setSelectedWorkSite: (workSite: WorkSite) => void;
  setIsEditModalOpen: (isOpen: boolean) => void;
  handleDeleteWorkSite: (id: number) => void;
  handleSort: (column: string) => void;
  sortBy: string;
  sortOrder: string;
}

const WorkSiteListTable = ({
  workSites,
  setSelectedWorkSite,
  setIsEditModalOpen,
  handleDeleteWorkSite,
  handleSort,
  sortBy,
  sortOrder,
}: WorkSiteListTableProps) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort("name")}>Name</TableHead>
            <TableHead onClick={() => handleSort("address")}>Address</TableHead>
            <TableHead onClick={() => handleSort("city")}>City</TableHead>
            <TableHead onClick={() => handleSort("state")}>State</TableHead>
            <TableHead onClick={() => handleSort("zip_code")}>
              Zip Code
            </TableHead>
            <TableHead onClick={() => handleSort("contact_person")}>
              Contact Person
            </TableHead>
            <TableHead onClick={() => handleSort("contact_phone")}>
              Contact Phone
            </TableHead>
            <TableHead onClick={() => handleSort("status")}>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workSites.map((workSite) => (
            <TableRow key={workSite.id}>
              <TableCell>
                {/* Use an onClick handler to navigate */}
                <span
                  style={{
                    cursor: "pointer",
                    color: "blue",
                    textDecoration: "underline",
                  }}
                  onClick={() => navigate(`/schedule?workSite=${workSite.id}`)}
                >
                  {workSite.name}
                </span>
              </TableCell>
              <TableCell>{workSite.address}</TableCell>
              <TableCell>{workSite.city}</TableCell>
              <TableCell>{workSite.state}</TableCell>
              <TableCell>{workSite.zip_code}</TableCell>
              <TableCell>{workSite.contact_person}</TableCell>
              <TableCell>{workSite.contact_phone}</TableCell>
              <TableCell>{workSite.status}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedWorkSite(workSite);
                      setIsEditModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteWorkSite(workSite.id!)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WorkSiteListTable;
