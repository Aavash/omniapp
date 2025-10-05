import { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import HomePage from "./components/websitePages/HomePage";
import AboutPage from "./components/websitePages/AboutPage";
import ServicesPage from "./components/websitePages/ServicesPage";
import ContactPage from "./components/websitePages/ContactPage";
import SchedulePage from "./components/employerPages/SchedulePage";
import EmployeePage from "./components/employerPages/EmployeePage";
import PaymentPage from "./components/employerPages/PaymentPage";
import SettingPage from "./components/employerPages/SettingPage";
import AttendancePage from "./components/employerPages/AttendancePage";
import EmployerProtectedRoutes from "./utils/EmployerProtectedRoute";
import { useAuth } from "./hooks/auth";
import EmployeeSchedule from "./components/employeePage/EmployeeSchedule";
import MyInformation from "./components/employeePage/MyInformation";
import SalarySlipPage from "./components/employeePage/SalarySlipPage";
import DashboardPage from "./components/employerPages/DashboardPage";
import EmployeeProtectedRoutes from "./utils/EmployeeProtectedRoute";
import { EmoployeeSidebar } from "./components/employeePage/EmployeeSidebar";
import { EmployerSidebar } from "./components/employerPages/EmployerSidebar";
import EmployeeDashboard from "./components/employeePage/EmployeeDashboard";
import WorkSitePage from "./components/employerPages/WorkSitePage";
import PresetPage from "./components/employerPages/PresetPage";
import { Availability } from "./components/employeePage/Availability";
import DailyOverview from "./components/employerPages/DailyOverview";

function App() {
  const { userData } = useAuth();

  useEffect(() => {}, [userData]);
  return (
    <>
      <Router>
        <SidebarProvider>
          {userData?.is_owner && <EmployerSidebar />}
          {userData?.is_employee && <EmoployeeSidebar />}
          {userData && <SidebarTrigger />}
          <Routes>
            <Route path="/" element={<HomePage />} />
            {!userData && (
              <>
                <Route path="/about" element={<AboutPage />} />
                <Route path="/service" element={<ServicesPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </>
            )}
            {userData?.is_owner && (
              <Route element={<EmployerProtectedRoutes />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/location" element={<WorkSitePage />} />
                <Route path="/daily-overview" element={<DailyOverview />} />
                <Route path="/employees" element={<EmployeePage />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/settings" element={<SettingPage />} />
                <Route path="/preset-template" element={<PresetPage />} />
              </Route>
            )}
            {userData?.is_employee && (
              <Route element={<EmployeeProtectedRoutes />}>
                <Route
                  path="/employee-dashboard"
                  element={<EmployeeDashboard />}
                />
                <Route
                  path="/employee-schedule"
                  element={<EmployeeSchedule />}
                />
                <Route
                  path="/employee-salary-slip"
                  element={<SalarySlipPage />}
                />
                <Route
                  path="/employee-information"
                  element={<MyInformation />}
                />
                <Route
                  path="/employee-availability"
                  element={<Availability />}
                />
              </Route>
            )}
          </Routes>
        </SidebarProvider>
      </Router>
    </>
  );
}

export default App;
