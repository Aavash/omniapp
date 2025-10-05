import { Skeleton } from "@/components/ui/skeleton";
import Planner from "../planner/Planner";
import { Schedule, Employee } from "@/models";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/utils/fetchInterceptor";
import { StatisticsCard } from "../StatisticsCard";
import { WorkSite } from "@/types/worksite";
import PresetGroupsList from "./PresetGroupList";

// Fetch employees
const fetchEmployees = async (): Promise<Employee[]> => {
  const response = await fetchApi("/api/employee/list", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch employees");
  }

  return response.json();
};

// Fetch schedules
const fetchSchedules = async (): Promise<{
  data: Schedule[];
  pagination: any;
}> => {
  const response = await fetchApi("/api/shift/list", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch schedules");
  }

  const responseData = await response.json();
  return {
    data: responseData.data,
    pagination: responseData.pagination,
  };
};

// Fetch worksites
const fetchWorksites = async (): Promise<WorkSite[]> => {
  const response = await fetchApi("/api/worksite/list", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch worksites");
  }

  return response.json();
};

// React Query hooks
const useEmployees = () => {
  return useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  });
};

const useSchedules = () => {
  return useQuery({
    queryKey: ["schedules"],
    queryFn: fetchSchedules,
  });
};

const useWorkSites = () => {
  return useQuery({
    queryKey: ["worksites"],
    queryFn: fetchWorksites,
  });
};

// Loading Skeletons
const StatisticsCardsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow-md">
          <Skeleton className="h-6 w-[150px] mb-2" />
          <Skeleton className="h-4 w-[100px] mb-2" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      ))}
    </div>
  );
};

const WorkSitesSkeleton = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center space-x-4 p-4 border rounded-lg"
        >
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
      ))}
    </div>
  );
};

const SchedulesTableSkeleton = () => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            {Array.from({ length: 5 }).map((_, index) => (
              <th
                key={index}
                className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <Skeleton className="h-4 w-[100px]" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index}>
              {Array.from({ length: 5 }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-[80px]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SchedulePlanner = () => {
  const {
    data: employees,
    // isLoading: isLoadingEmployees,
    error: employeeError,
  } = useEmployees();
  const {
    data: schedulesResponse,
    isLoading: isLoadingSchedules,
    error: scheduleError,
  } = useSchedules();

  const {
    data: workSites,
    isLoading: isLoadingWorkSites,
    error: workSiteError,
  } = useWorkSites();

  const schedules = schedulesResponse;

  if (employeeError || scheduleError || workSiteError) {
    return <div>Error: {employeeError?.message || scheduleError?.message}</div>;
  }

  return (
    <div className="flex flex-col w-full bg-gray-100">
      <div className="p-4 md:p-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold">
              Weekly Template
            </h2>
          </div>
          {isLoadingWorkSites ? (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <Skeleton className="h-6 w-[200px] mb-4" />
              <WorkSitesSkeleton />
            </div>
          ) : (
            <>
              <PresetGroupsList worksites={workSites} />
              <p className="mb-4 text-sm md:text-base text-gray-600">
                Creating a weekly template can save you time and ensure
                consistent scheduling. With a preset, you can quickly apply your
                preferred shift patterns and employee assignments, making weekly
                planning a breeze.
              </p>
            </>
          )}
        </div>

        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {isLoadingEmployees ? (
            <StatisticsCardsSkeleton />
          ) : (
            <>
              <StatisticsCard
                title="Total Shifts"
                value={schedules?.data.length || 0}
                description="Shifts scheduled this week"
              />
              <StatisticsCard
                title="Employees Available"
                value={employees?.length || 0}
                description="Employees available this week"
              />
              <StatisticsCard
                title="Upcoming Schedules"
                value={schedules?.pagination.total_items || 0}
                description="Schedules for next week"
              />
            </>
          )}
        </div> */}

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          {isLoadingSchedules ? (
            <SchedulesTableSkeleton />
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold">
                  Weekly Schedule
                </h2>
              </div>
              <Planner
                initialEmployees={employees || []}
                initialSchedules={schedules || { data: [], pagination: {} }}
                initialWorkSites={workSites || []}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulePlanner;
