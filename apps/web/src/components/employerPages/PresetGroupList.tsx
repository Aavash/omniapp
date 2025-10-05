import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "@/utils/fetchInterceptor";
import { GroupResponse } from "@/types/shift";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { WorkSite } from "@/types/worksite";
import toast from "react-hot-toast";

// Fetch preset groups
const fetchPresetGroups = async (): Promise<GroupResponse> => {
  const response = await fetchApi("/api/shift-preset/group/list", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch preset groups");
  }

  return response.json();
};

// Delete a preset group
const deletePresetGroup = async (groupId: string) => {
  const response = await fetchApi(`/api/shift-preset/group/delete/${groupId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete preset group");
  }

  return response.json();
};

// Create a new preset group
const createPresetGroup = async ({
  title,
  worksite_id,
}: {
  title: string;
  worksite_id: string;
}) => {
  const response = await fetchApi("/api/shift-preset/group/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, worksite_id }),
  });

  if (!response.ok) {
    throw new Error("Failed to create preset group");
  }

  return response.json();
};

interface PresetGroupsListProps {
  worksites: WorkSite[] | undefined;
}

const PresetGroupsList: React.FC<PresetGroupsListProps> = ({ worksites }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [selectedWorksiteId, setSelectedWorksiteId] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  // Fetch data using useQuery
  const { data, isLoading, isError } = useQuery({
    queryKey: ["presetGroups"],
    queryFn: fetchPresetGroups,
  });

  // Mutation for deleting a group
  const deleteMutation = useMutation({
    mutationFn: deletePresetGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presetGroups"] });
      toast.success("Preset group deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete preset group.");
    },
  });

  // Mutation for creating a group
  const createMutation = useMutation({
    mutationFn: createPresetGroup,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["presetGroups"] });
      setIsDialogOpen(false);
      setNewGroupTitle("");
      setSelectedWorksiteId("");
      navigate(`/preset-template?preset_group_id=${data.id}`);
    },
  });

  // Handle delete confirmation
  const handleDeleteConfirmation = (groupId: string) => {
    setGroupToDelete(groupId);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete action
  const handleDelete = () => {
    if (groupToDelete) {
      deleteMutation.mutate(groupToDelete);
      setIsDeleteDialogOpen(false);
      setGroupToDelete(null);
    }
  };

  const handleCreate = () => {
    if (newGroupTitle.trim() && selectedWorksiteId) {
      createMutation.mutate({
        title: newGroupTitle,
        worksite_id: selectedWorksiteId,
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error fetching data</div>;
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex overflow-x-auto space-x-4 pb-4">
        {data?.groups.map((group) => (
          <Card key={group.id} className="min-w-[300px] flex-shrink-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{group.title}</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    navigate(`/preset-template?preset_group_id=${group.id}`)
                  }
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteConfirmation(String(group.id))} // Open delete confirmation dialog
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Worksite:</strong> {group.worksite_name}
                </p>
                <p>
                  <strong>Total Shift Hours:</strong>{" "}
                  {group.analytics.total_shift_hours}
                </p>
                <p>
                  <strong>Employees Scheduled:</strong>{" "}
                  {group.analytics.total_employees_scheduled}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="min-w-[300px] flex-shrink-0 flex items-center justify-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex flex-col items-center space-y-2 p-6 w-full h-full"
              >
                <span className="text-2xl">+</span>
                <span className="text-center">Add Template</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Preset Group</DialogTitle>
                <DialogDescription>
                  Enter a title and select a worksite for the new preset group.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.target.value)}
                placeholder="Group Title"
                className="mb-4"
              />
              <Select
                value={selectedWorksiteId}
                onValueChange={setSelectedWorksiteId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a worksite" />
                </SelectTrigger>
                <SelectContent>
                  {worksites?.map((worksite) => (
                    <SelectItem key={worksite.id} value={String(worksite.id)}>
                      {worksite.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Preset Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this preset group? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PresetGroupsList;
