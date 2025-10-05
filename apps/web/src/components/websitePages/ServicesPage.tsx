import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Users, Clock, ShieldCheck, Rocket } from "lucide-react";
import Navbar from "../Navbar";

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 w-full">
      {/* Navbar */}
      <Navbar />

      {/* Services Section */}
      <div className="py-20 flex-1">
        <div className="max-w-screen-2xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-blue-900 mb-12">
            Our Services
          </h2>

          {/* Grid Layout for Services */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {/* Service 1 */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-900">
                  Workforce Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center">
                  <Rocket className="h-12 w-12 text-blue-600 mb-4" />
                  <CardDescription className="text-gray-700">
                    Leverage cutting-edge AI to optimize your team's
                    performance. Our platform dynamically adjusts schedules,
                    ensuring maximum productivity and work-life balance for your
                    employees.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>

            {/* Service 2 */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-900">
                  Seamless Time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center">
                  <Clock className="h-12 w-12 text-blue-600 mb-4" />
                  <CardDescription className="text-gray-700">
                    Say goodbye to manual time logs. With Shift Bay, tracking
                    work hours is a breeze. Employees can clock in/out from any
                    device, and managers get real-time insights into team
                    activity.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>

            {/* Service 3 */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-900">
                  Compliance Simplified
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center">
                  <ShieldCheck className="h-12 w-12 text-blue-600 mb-4" />
                  <CardDescription className="text-gray-700">
                    Navigating compliance can be complicated. Our platform
                    ensures that your business adheres to local and
                    international labor laws, automating reports and audits to
                    give you peace of mind.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>

            {/* Service 4 */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-900">
                  Team Collaboration & Communication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center">
                  <Users className="h-12 w-12 text-blue-600 mb-4" />
                  <CardDescription className="text-gray-700">
                    Facilitate seamless communication between team members with
                    built-in chat, notifications, and task management tools.
                    Shift Bay ensures your workforce is always in sync and on
                    track.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call-to-Action Section */}
          <div className="text-center mt-16">
            <h3 className="text-3xl font-bold text-blue-900 mb-6">
              Let’s Transform Your Business Together
            </h3>
            <p className="text-gray-700 mb-8">
              Shift Bay isn't just a tool—it's your partner in success. Let us
              show you how our innovative services can take your workforce to
              the next level.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-8 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>
            &copy; {new Date().getFullYear()} Shift Bay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
