import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PresetTable } from "./PresetTable";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import ApplyPresetModal from "./ApplyPresetModal";
import { fetchApi } from "@/utils/fetchInterceptor";
import { PresetGroup, ShiftPreset } from "@/types/shift";
import { Employee } from "@/types/employee";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { WorkSite } from "@/types/worksite";

export default function PresetSchedulePageWrapper() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const presetGroupId = searchParams.get("preset_group_id") || "new";
  const [selectedWeek, setSelectedWeek] = useState<{ from: Date; to: Date }>();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [selectedWorksiteId, setSelectedWorksiteId] = useState("");

  const fetchWorksites = async (): Promise<WorkSite[]> => {
    const response = await fetchApi("/api/worksite/list", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch worksites");
    return response.json();
  };

  const fetchEmployees = async (): Promise<Employee[]> => {
    const response = await fetchApi("/api/employee/list");
    if (!response.ok) throw new Error("Failed to fetch employees");
    return response.json();
  };

  const fetchShiftPresets = async (groupId: string): Promise<ShiftPreset[]> => {
    const response = await fetchApi(`/api/shift-preset/list/${groupId}`);
    if (!response.ok) throw new Error("Failed to fetch shift presets");
    return response.json();
  };

  const fetchPresetGroupDetails = async (
    groupId: string
  ): Promise<PresetGroup> => {
    const response = await fetchApi(`/api/shift-preset/group/${groupId}`);
    if (!response.ok) throw new Error("Failed to fetch preset group details");
    return response.json();
  };

  const updatePresetGroup = async (group: {
    id: string;
    title: string;
    worksite_id: string;
  }): Promise<PresetGroup> => {
    const response = await fetchApi(
      `/api/shift-preset/group/edit/${group.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: group.title,
          worksite_id: group.worksite_id,
        }),
      }
    );
    if (!response.ok) throw new Error("Failed to update preset group");
    return response.json();
  };

  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  });

  const { data: worksites } = useQuery({
    queryKey: ["worksites"],
    queryFn: fetchWorksites,
  });

  const { data: shiftPresets, isLoading: isLoadingShiftPresets } = useQuery({
    queryKey: ["shift-presets", presetGroupId],
    queryFn: () => fetchShiftPresets(presetGroupId),
    enabled: !!presetGroupId,
  });

  const { data: presetGroupDetails, isLoading: isLoadingPresetGroupDetails } =
    useQuery({
      queryKey: ["presetGroupDetails", presetGroupId],
      queryFn: () => fetchPresetGroupDetails(presetGroupId),
      enabled: !!presetGroupId,
      // select: (data) => {
      //   setEditedTitle(data.title);
      //   setSelectedWorksiteId(data.worksite_id.toString());
      //   return data;
      // },
    });

  const mutation = useMutation({
    mutationFn: updatePresetGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["presetGroupDetails", presetGroupId],
      });
      setIsEditing(false);
    },
  });

  const handleEdit = () => {
    if (presetGroupDetails) {
      setEditedTitle(presetGroupDetails.title);
      setSelectedWorksiteId(presetGroupDetails.worksite_id.toString());
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (presetGroupDetails) {
      mutation.mutate({
        id: String(presetGroupDetails.id),
        title: editedTitle,
        worksite_id: selectedWorksiteId,
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const isLoading =
    isLoadingEmployees || isLoadingShiftPresets || isLoadingPresetGroupDetails;
  const hasData = employees && shiftPresets && presetGroupDetails && worksites;

  if (isLoading) return <div>Loading...</div>;
  if (!hasData) return <div>Failed to fetch data</div>;

  const presetEmployees = employees.filter((emp) => {
    return shiftPresets.some((preset) => preset.employee_id === emp.id);
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Weekly Template</h1>
      <p className="mb-4">
        Manage and apply preset schedules for your employees.
      </p>

      <div className="mb-6">
        {isEditing ? (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">
                Preset Group
              </label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Worksite</label>
              <select
                value={selectedWorksiteId}
                onChange={(e) => setSelectedWorksiteId(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {worksites.map((worksite) => (
                  <option key={worksite.id} value={worksite.id}>
                    {worksite.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={mutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-semibold">
              Preset Group: {presetGroupDetails.title}
            </p>
            <p className="text-lg font-semibold">
              Worksite: {presetGroupDetails.worksite_name}
            </p>
            <Button onClick={handleEdit} variant="outline" className="mt-2">
              Edit
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-end mb-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Apply Preset</Button>
          </DialogTrigger>
          <ApplyPresetModal
            presetGroupId={presetGroupId}
            employees={presetEmployees}
            presetGroupDetails={presetGroupDetails}
            selectedWeek={selectedWeek}
            setSelectedWeek={setSelectedWeek}
            navigate={navigate}
          />
        </Dialog>
      </div>

      {selectedWeek && (
        <div className="mb-6">
          <p className="text-lg font-semibold">
            Selected Week: {format(selectedWeek.from, "MM/dd/yyyy")} -{" "}
            {format(selectedWeek.to, "MM/dd/yyyy")}
          </p>
        </div>
      )}

      <PresetTable
        employees={employees}
        shiftPresets={shiftPresets}
        presetGroup={presetGroupDetails}
      />
    </div>
  );
}
