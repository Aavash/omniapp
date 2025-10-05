import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/auth";
import { Users, Clock, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";

export default function WelcomePage() {
  const { userData } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (userData?.is_owner) {
      navigate("/dashboard");
      window.location.reload();
    } else if (userData?.is_employee) {
      navigate("/employee-dashboard");
      window.location.reload();
    }
  }, [userData, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 w-full">
      <Navbar />
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-4">
        <h1 className="text-5xl font-bold text-blue-900 mb-4">
          Welcome to <span className="text-blue-600">Shift Bay</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-8">
          Streamline your workforce management with Shift Bay. Effortlessly
          schedule, track, and optimize your team's productivity.
        </p>
        <div className="flex gap-4">
          <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
          <Button variant="outline" className="border-blue-600 text-blue-900">
            Learn More
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-screen-2xl mx-auto px-4">
          {" "}
          {/* Updated: Use max-w-screen-2xl */}
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">
            Why Choose Shift Bay?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle className="text-blue-900">
                  Employee Management
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Easily manage employee profiles, roles, and schedules in one
                  place.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle className="text-blue-900">
                  Shift Scheduling
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Create and manage shifts effortlessly with our intuitive
                  scheduling tools.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <ShieldCheck className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle className="text-blue-900">
                  Security & Compliance
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Ensure data security and compliance with industry standards.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Call-to-Action Section */}
      <div className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-screen-2xl mx-auto px-4 text-center">
          {" "}
          {/* Updated: Use max-w-screen-2xl */}
          <h2 className="text-3xl font-bold text-blue-900 mb-4">
            Ready to Transform Your Workforce?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join Shift Bay today and experience the future of employee
            management.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">Sign Up Now</Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-8 bg-white border-t border-gray-200">
        {" "}
        {/* Updated: Add w-full */}
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>
            &copy; {new Date().getFullYear()} Shift Bay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
