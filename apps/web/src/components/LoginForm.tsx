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
  Form,
  FormField,
  FormControl,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUnAuthApi } from "@/utils/fetchInterceptor";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth";

const loginUser = async (data: ILoginInput) => {
  const response = await fetchUnAuthApi("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Login failed");
  return response.json();
};

const fetchUserData = async ({ token }: { token: string }) => {
  const response = await fetch(
    import.meta.env.VITE_SERVER_URL + "/api/auth/me",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Add the token to the headers
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  return response.json();
};

interface ILoginInput {
  email: string;
  password: string;
}

interface LoginFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginForm({ isOpen, onClose }: LoginFormProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const form = useForm<ILoginInput>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (response) => {
      try {
        const userData = await queryClient.fetchQuery({
          queryKey: ["userData", response.access_token],
          queryFn: () => fetchUserData({ token: response.access_token }),
        });
        setAuth(response.access_token, userData); // Update the auth state
        toast.success(`Welcome ${userData.full_name}`);
        form.reset();
        onClose();
        if (userData?.is_owner) {
          navigate("/dashboard");
        } else if (userData?.is_employee) {
          navigate("/employee-dashboard");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const onSubmit: SubmitHandler<ILoginInput> = (data) => {
    mutation.mutate(data);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log In</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field} // Spread the field object to bind value and onChange
                        type="email"
                        placeholder="Enter your email"
                        className="mt-3"
                      />
                    </FormControl>
                    {form.formState.errors.email && (
                      <FormMessage>
                        {form.formState.errors.email.message ||
                          "Email is required"}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field} // Spread the field object to bind value and onChange
                        type="password"
                        placeholder="Enter your password"
                        className="mt-3"
                      />
                    </FormControl>
                    {form.formState.errors.password && (
                      <FormMessage>
                        {form.formState.errors.password.message ||
                          "Password is required"}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Logging In..." : "Log In"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Toaster position="top-center" />
    </>
  );
}
