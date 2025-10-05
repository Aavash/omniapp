import React, { useEffect } from "react";
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
import { Employee } from "@/types/employee";
import { useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/utils/fetchInterceptor";

// Define the Zod schema based on the backend model
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
    .max(255, "Address cannot exceed 255 characters")
    .optional(), // Make address optional
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")), // Allows an empty string
  pay_type: z.enum(["HOURLY", "SALARY", "MONTHLY"]), // Add "MONTHLY" to the enum
  payrate: z.number().min(0, "Pay Rate must be greater than or equal to 0"),
  is_owner: z.boolean().default(false),
});

// Infer the TypeScript type from the Zod schema
type EmployeeFormData = z.infer<typeof employeeSchema> & {
  id?: number; // Add id as an optional property
};

export const updateEmployee = async (employee: EmployeeFormData) => {
  const response = await fetchApi(`/api/employee/edit/${employee.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employee), // Convert the employee object to JSON
  });

  if (!response.ok) {
    throw new Error("Failed to update employee");
  }

  return response.json(); // Parse and return the response data
};

interface EditEmployeeFormProps {
  selectedEmployee: Employee | null;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
}

const EditEmployeeForm: React.FC<EditEmployeeFormProps> = ({
  selectedEmployee,
  isEditModalOpen,
  setIsEditModalOpen,
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });

  useEffect(() => {
    if (selectedEmployee) {
      reset({
        full_name: selectedEmployee.full_name,
        email: selectedEmployee.email,
        phone_number: selectedEmployee.phone_number,
        phone_number_ext: selectedEmployee.phone_number_ext,
        address: selectedEmployee.address || "",
        password: "",
        pay_type: selectedEmployee.pay_type,
        payrate: selectedEmployee.payrate,
        is_owner: selectedEmployee.is_owner || false,
      });
    }
  }, [selectedEmployee, reset]);

  // Mutation for updating an employee
  const updateMutation = useMutation({
    mutationFn: (employee: EmployeeFormData) => updateEmployee(employee),
    onSuccess: () => {
      reset();
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      console.error("Error updating employee:", error);
    },
  });

  // Handle edit employee
  const handleEditEmployee = (data: EmployeeFormData) => {
    const employee: EmployeeFormData = {
      ...data,
      id: selectedEmployee?.id, // Include the selected employee's ID
    };
    updateMutation.mutate(employee); // Trigger the mutation
  };

  const onSubmit = (data: EmployeeFormData) => {
    handleEditEmployee(data);
  };

  return (
    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>Update the employee details.</DialogDescription>
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
                    <SelectItem value="MONTHLY">Monthly</SelectItem>{" "}
                    {/* Add Monthly option */}
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
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Updating..." : "Update Employee"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeForm;
