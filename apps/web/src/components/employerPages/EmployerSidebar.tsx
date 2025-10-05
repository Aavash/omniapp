import { SidebarItem } from "@/components/ui/SidebarItem";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/auth";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom"; // For navigation
import { Button } from "../ui/button";

export function EmployerSidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = () => {
    toast.success("You have been logged out");
    logout();
    navigate("/");
  };

  return (
    <>
      <Sidebar>
        {/* Sidebar Header */}
        <SidebarHeader>
          <h2 className="text-lg font-semibold text-gray-800">WorkPulse</h2>
        </SidebarHeader>

        {/* Sidebar Content */}
        <SidebarContent>
          {/* First Group */}
          <SidebarGroup title="Main">
            <SidebarItem to="/dashboard">Dashboard</SidebarItem>
            <SidebarItem to="/schedule">Schedule</SidebarItem>
            <SidebarItem to="/employees">Employees</SidebarItem>
            <SidebarItem to="/location">Work Sites</SidebarItem>
            <SidebarItem to="/daily-overview">Daily Overview</SidebarItem>
          </SidebarGroup>

          {/* Second Group */}
          <SidebarGroup title="Management">
            <SidebarItem to="/payment">Payment</SidebarItem>
            <SidebarItem to="/attendance">Attendance</SidebarItem>
            <SidebarItem to="/settings">Settings</SidebarItem>
          </SidebarGroup>

          <SidebarGroup title="Logout">
            <Button
              onClick={handleLogout}
              className="mt-10 ml-10 mr-10  text-white bg-red-600 hover:bg-red-700 rounded-md text-center"
            >
              Logout
            </Button>
          </SidebarGroup>
        </SidebarContent>

        {/* Sidebar Footer */}
        <SidebarFooter>
          <p className="text-sm text-gray-500">© 2025 Shift Bay </p>

          {/* Logout Button */}
        </SidebarFooter>
      </Sidebar>
      <Toaster position="top-center"></Toaster>
    </>
  );
}
