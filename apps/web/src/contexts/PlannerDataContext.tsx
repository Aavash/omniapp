import { createContext, useContext, ReactNode, FC, useMemo } from "react";
import { ScheduleService, EmployeeService } from "../services";
import { Schedule, Employee } from "../models";
import { WorkSite } from "@/types/worksite";
import { WorkSiteService } from "@/services/WorkSiteService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface DataContextType {
  schedules: { data: Schedule[]; pagination: any } | undefined;
  employees: Employee[] | undefined;
  workSites: WorkSite[] | undefined;
  addSchedule: (schedule: Schedule) => Promise<void>;
  updateSchedule: (schedule: Schedule) => Promise<void>;
  removeSchedule: (id: string) => Promise<void>;
  addEmployee: (employee: Employee) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  removeEmployee: (id: string) => Promise<void>;
  fetchSchedules: (
    dateRange: { from?: Date; to?: Date },
    workSiteId: number | null
  ) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const PlannerDataContextProvider: FC<{
  children: ReactNode;
  initialSchedules: { data: Schedule[]; pagination: any };
  initialEmployees: Employee[];
  initialWorkSites: WorkSite[];
}> = ({
  children,
  initialSchedules,
  initialEmployees,
  initialWorkSites: initialWorkSite,
}) => {
  const queryClient = useQueryClient();

  const scheduleService = useMemo(
    () => new ScheduleService(initialSchedules),
    [initialSchedules]
  );
  const employeeService = useMemo(
    () => new EmployeeService(initialEmployees),
    [initialEmployees]
  );
  const workSiteService = useMemo(
    () => new WorkSiteService(initialWorkSite),
    [initialWorkSite]
  );

  const { data: schedules } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      return await scheduleService.getSchedules();
    },
    initialData: initialSchedules,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      return await employeeService.getEmployees();
    },
    initialData: initialEmployees,
  });

  const { data: workSites } = useQuery({
    queryKey: ["workSites"],
    queryFn: async () => {
      return await workSiteService.getWorkSites();
    },
    initialData: initialWorkSite,
  });

  const fetchSchedules = async (
    dateRange: { from?: Date; to?: Date },
    workSiteId: number | null
  ) => {
    try {
      const schedules = await scheduleService.getSchedules({
        dateRange,
        workSiteId,
      });
      queryClient.setQueryData(["schedules"], schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const addScheduleMutation = useMutation({
    mutationFn: async (schedule: Schedule) => {
      return await scheduleService.createSchedule(schedule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (schedule: Schedule) => {
      return await scheduleService.updateSchedule(schedule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });

  const removeScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await scheduleService.deleteSchedule(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (employee: Employee) => {
      return await employeeService.addEmployee(employee);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (employee: Employee) => {
      return await employeeService.updateEmployee(employee);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const removeEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await employeeService.removeEmployee(+id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const contextValue: DataContextType = useMemo(
    () => ({
      schedules,
      employees,
      workSites,
      addSchedule: async (schedule) => {
        await addScheduleMutation.mutateAsync(schedule);
      },
      updateSchedule: async (schedule) => {
        await updateScheduleMutation.mutateAsync(schedule);
      },
      removeSchedule: async (id) => {
        await removeScheduleMutation.mutateAsync(id);
      },
      addEmployee: async (employee) => {
        await addEmployeeMutation.mutateAsync(employee);
      },
      updateEmployee: async (employee) => {
        await updateEmployeeMutation.mutateAsync(employee);
      },
      removeEmployee: async (id) => {
        await removeEmployeeMutation.mutateAsync(id);
      },
      fetchSchedules,
    }),
    [schedules, employees, workSites, fetchSchedules]
  );

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a PlannerDataContextProvider");
  }
  return context;
};
