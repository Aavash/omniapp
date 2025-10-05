import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import toast, { Toaster } from "react-hot-toast";
import { fetchApi } from "@/utils/fetchInterceptor";

interface IFormInput {
  owner_name: string;
  owner_email: string;
  password: string;
  confirm_password: string;
  phone_number_ext: string;
  phone_number: string;
  organization_name: string;
  org_address: string;
  abbrebiation: string;
  organization_category: number;
}

interface Category {
  id: number;
  name: string;
}

interface CompanyFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetchApi("/api/organization/categories");
  if (!response.ok) throw new Error("Failed to fetch categories");
  return response.json();
};

const createOrganization = async (data: IFormInput) => {
  const response = await fetchApi("/api/organization/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create organization");
  return response.json();
};

export default function CreateCompanyForm({
  isOpen,
  onClose,
}: CompanyFormProps) {
  const form = useForm<IFormInput>({
    defaultValues: {
      phone_number_ext: "+1",
    },
  });

  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["organizationCategories"],
    queryFn: fetchCategories,
  });

  const mutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      toast.success(`Company was successfully created`);
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast.error("There was an error creating company");
    },
  });

  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    mutation.mutate({
      ...data,
      organization_category: Number(data.organization_category),
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Enter details to register your organization
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-bold">Organization Details</h2>
                  <FormField
                    control={form.control}
                    name="organization_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="abbrebiation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Abbreviation</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="org_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="organization_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Category</FormLabel>
                        <FormControl>
                          {isLoading ? (
                            <p>Loading categories...</p>
                          ) : error ? (
                            <p className="text-red-500">
                              Failed to load categories
                            </p>
                          ) : (
                            <Select
                              onValueChange={field.onChange}
                              value={field.value?.toString()}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories?.map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={String(category.id)}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Employer Details</h2>
                  <FormField
                    control={form.control}
                    name="owner_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="owner_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone_number_ext"
                    render={() => <div />}
                  />

                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <div className="flex items-center space-x-2">
                          <div className="flex-[0_0_20%]">
                            <Select defaultValue="+1">
                              <SelectTrigger>
                                <SelectValue placeholder="+1" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="+1">+1</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-[0_0_80%]">
                            <FormControl>
                              <Input {...field} type="tel" />
                            </FormControl>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Toaster position="top-center"></Toaster>
    </>
  );
}
