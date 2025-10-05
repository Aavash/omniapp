import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchApi } from "@/utils/fetchInterceptor";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { WorkSite } from "@/types/worksite";

// Define the Zod schema for WorkSite
const workSiteSchema = z.object({
  id: z.number().optional(), // Include ID for editing
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip_code: z
    .string()
    .min(1, "Zip code is required")
    .max(10, "Zip code must be 10 characters or less"),
  contact_person: z.string().optional(),
  contact_phone: z
    .string()
    .max(15, "Contact phone must be 15 characters or less")
    .optional(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

// Infer the TypeScript type from the Zod schema
type WorkSiteFormData = z.infer<typeof workSiteSchema>;

interface EditWorkSiteFormProps {
  selectedWorkSite: WorkSite | null;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (isOpen: boolean) => void;
}

const EditWorkSiteForm = ({
  selectedWorkSite,
  isEditModalOpen,
  setIsEditModalOpen,
}: EditWorkSiteFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<WorkSiteFormData>({
    resolver: zodResolver(workSiteSchema),
    defaultValues: {
      status: "Active", // Set default value for status
    },
  });

  const queryClient = useQueryClient();

  // Populate form with selectedWorkSite data
  useEffect(() => {
    if (selectedWorkSite) {
      setValue("id", selectedWorkSite.id);
      setValue("name", selectedWorkSite.name);
      setValue("address", selectedWorkSite.address);
      setValue("city", selectedWorkSite.city);
      setValue("state", selectedWorkSite.state);
      setValue("zip_code", selectedWorkSite.zip_code);
      setValue("contact_person", selectedWorkSite.contact_person || "");
      setValue("contact_phone", selectedWorkSite.contact_phone || "");
      setValue("status", selectedWorkSite.status);
    }
  }, [selectedWorkSite, setValue]);

  const onSubmit = async (data: WorkSiteFormData) => {
    try {
      const response = await fetchApi(`/api/worksite/edit/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsEditModalOpen(false);
        toast.success("Work site updated successfully!");
        reset(); // Reset the form after successful submission

        // Invalidate the query to refetch the list of work sites
        queryClient.invalidateQueries({ queryKey: ["workSites"] });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update work site.");
      }
    } catch (error) {
      toast.error("An error occurred while updating the work site.");
    }
  };

  return (
    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Work Site</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input placeholder="Name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Input placeholder="Address" {...register("address")} />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>
          <div>
            <Input placeholder="City" {...register("city")} />
            {errors.city && (
              <p className="text-sm text-red-500">{errors.city.message}</p>
            )}
          </div>
          <div>
            <Input placeholder="State" {...register("state")} />
            {errors.state && (
              <p className="text-sm text-red-500">{errors.state.message}</p>
            )}
          </div>
          <div>
            <Input placeholder="Zip Code" {...register("zip_code")} />
            {errors.zip_code && (
              <p className="text-sm text-red-500">{errors.zip_code.message}</p>
            )}
          </div>
          <div>
            <Input
              placeholder="Contact Person"
              {...register("contact_person")}
            />
            {errors.contact_person && (
              <p className="text-sm text-red-500">
                {errors.contact_person.message}
              </p>
            )}
          </div>
          <div>
            <Input placeholder="Contact Phone" {...register("contact_phone")} />
            {errors.contact_phone && (
              <p className="text-sm text-red-500">
                {errors.contact_phone.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <label>Status:</label>
            <select {...register("status")} className="p-2 border rounded">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            )}
          </div>
          <Button type="submit">Update</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditWorkSiteForm;
