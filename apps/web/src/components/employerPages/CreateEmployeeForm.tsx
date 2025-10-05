import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fetchApi } from "@/utils/fetchInterceptor";

interface CreateEmployeeFormProps {
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

const employeeSchema = z.object({
  full_name: z
    .string()
    .min(1, "Full Name is required")
    .max(150, "Full Name cannot exceed 150 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .max(50, "Email cannot exceed 50 characters"),
  phone_number: z
    .string()
    .min(10, "Phone Number must be exactly 10 digits")
    .max(10, "Phone Number must be exactly 10 digits"),
  phone_number_ext: z
    .string()
    .max(5, "Phone Number Extension cannot exceed 5 characters")
    .optional(),
  address: z
    .string()
    .min(1, "Address is required")
    .max(255, "Address cannot exceed 255 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  pay_type: z.enum(["HOURLY", "SALARY"]),
  payrate: z.number().min(0, "Pay Rate must be greater than or equal to 0"),
  is_owner: z.boolean().default(false),
});

// Infer the TypeScript type from the Zod schema
type EmployeeFormData = z.infer<typeof employeeSchema>;

// API function to add an employee
const addEmployee = async (employeeData: EmployeeFormData) => {
  const response = await fetchApi("/api/employee/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employeeData),
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.detail || "Failed to add employee");
  }

  return response.json();
};

const CreateEmployeeForm: React.FC<CreateEmployeeFormProps> = ({
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema), // Integrate Zod with react-hook-form
    defaultValues: {
      pay_type: "HOURLY", // Default value for the Select component
      is_owner: false, // Default value for the checkbox
    },
  });

  const addMutation = useMutation({
    mutationFn: addEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee added successfully!");
      reset(); // Reset the form
      setIsAddModalOpen(false); // Close the modal
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add employee.");
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    addMutation.mutate(data);
  };

  return (
    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>
            Fill out the form to add a new employee.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              {...register("full_name")}
              placeholder="John Doe"
            />
            {errors.full_name && (
              <p className="text-sm text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="john.doe@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              {...register("phone_number")}
              placeholder="1234567890"
            />
            {errors.phone_number && (
              <p className="text-sm text-red-500">
                {errors.phone_number.message}
              </p>
            )}
          </div>

          {/* Phone Number Extension */}
          <div>
            <Label htmlFor="phone_number_ext">Phone Number Extension</Label>
            <Input
              id="phone_number_ext"
              {...register("phone_number_ext")}
              placeholder="123"
            />
            {errors.phone_number_ext && (
              <p className="text-sm text-red-500">
                {errors.phone_number_ext.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="123 Main St"
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder="••••••"
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Pay Type */}
          <div>
            <Label htmlFor="pay_type">Pay Type</Label>
            <Controller
              name="pay_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Pay Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOURLY">Hourly</SelectItem>
                    <SelectItem value="SALARY">Salary</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.pay_type && (
              <p className="text-sm text-red-500">{errors.pay_type.message}</p>
            )}
          </div>

          {/* Pay Rate */}
          <div>
            <Label htmlFor="payrate">Pay Rate</Label>
            <Input
              id="payrate"
              type="number"
              {...register("payrate", { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.payrate && (
              <p className="text-sm text-red-500">{errors.payrate.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={addMutation.isPending}>
            {addMutation.isPending ? "Adding..." : "Add Employee"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEmployeeForm;
