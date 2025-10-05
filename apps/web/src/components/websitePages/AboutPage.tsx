import { Button } from "@/components/ui/button";
import { Users, ShieldCheck, Rocket } from "lucide-react";
import Navbar from "../Navbar";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 w-full">
      {/* Navbar */}
      <Navbar />

      {/* About Section */}
      <div className="py-20 flex-1">
        <div className="max-w-screen-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">
            About Shift Bay
          </h2>
          <div className="space-y-12">
            {/* Mission Section */}
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-blue-900 mb-6">
                Our Mission
              </h3>
              <p className="text-gray-700">
                At Shift Bay, our mission is to revolutionize workforce
                management by providing innovative tools that empower businesses
                to schedule, track, and optimize their teams with ease. We
                strive to create a seamless experience for employers and
                employees alike, fostering productivity and growth.
              </p>
            </div>

            {/* Values Section */}
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-blue-900 mb-6">
                Our Values
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Value 1 */}
                <div className="text-center">
                  <Rocket className="h-10 w-10 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-blue-900 mb-2">
                    Innovation
                  </h4>
                  <p className="text-gray-700">
                    We constantly innovate to deliver cutting-edge solutions
                    that meet the evolving needs of modern businesses.
                  </p>
                </div>

                {/* Value 2 */}
                <div className="text-center">
                  <Users className="h-10 w-10 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-blue-900 mb-2">
                    Collaboration
                  </h4>
                  <p className="text-gray-700">
                    We believe in the power of teamwork and collaboration to
                    achieve shared goals and drive success.
                  </p>
                </div>

                {/* Value 3 */}
                <div className="text-center">
                  <ShieldCheck className="h-10 w-10 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-blue-900 mb-2">
                    Integrity
                  </h4>
                  <p className="text-gray-700">
                    We operate with honesty and transparency, building trust
                    with our customers and partners.
                  </p>
                </div>
              </div>
            </div>

            {/* Team Section */}
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-blue-900 mb-6">
                Meet Our Team
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Team Member 1 */}
                <div className="text-center">
                  <img
                    src="https://via.placeholder.com/150"
                    alt="Team Member"
                    className="w-32 h-32 rounded-full mx-auto mb-4"
                  />
                  <h4 className="text-xl font-bold text-blue-900 mb-2">
                    Aavash Khatri
                  </h4>
                  <p className="text-gray-700">CEO & Founder</p>
                </div>

                {/* Team Member 2 */}
                <div className="text-center">
                  <img
                    src="https://via.placeholder.com/150"
                    alt="Team Member"
                    className="w-32 h-32 rounded-full mx-auto mb-4"
                  />
                  <h4 className="text-xl font-bold text-blue-900 mb-2">
                    Roshan Pokhrel
                  </h4>
                  <p className="text-gray-700">CT0 & founder</p>
                </div>

                {/* Team Member 3 */}
                <div className="text-center">
                  <img
                    src="https://via.placeholder.com/150"
                    alt="Team Member"
                    className="w-32 h-32 rounded-full mx-auto mb-4"
                  />
                  <h4 className="text-xl font-bold text-blue-900 mb-2">
                    Rojan Khulal
                  </h4>
                  <p className="text-gray-700">Operations Mananger & Founder</p>
                </div>
              </div>
            </div>

            {/* Call-to-Action Section */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-900 mb-6">
                Ready to Join Us?
              </h3>
              <p className="text-gray-700 mb-8">
                Discover how Shift Bay can transform your workforce management.
                Get started today!
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </div>
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
