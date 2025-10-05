import React, { FC, useEffect, useMemo, useState } from "react";
import CalendarToolbar from "./PlannerToolbar";
import Schedule from "./Schedule";
import { Schedule as ScheduleType, Employee } from "@/models";
import {
  PlannerDataContextProvider,
  useData,
} from "@/contexts/PlannerDataContext";
import { PlannerProvider, useCalendar } from "@/contexts/PlannerContext";
import { Timeline } from "./Timeline";
import { Table, TableBody, TableRow } from "../ui/table";
import EmployeeTableCell from "./EmployeeTableCell";
import DropTableCell from "./DropTableCell";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { calculateNewDates, filterSchedules } from "@/lib/planner";
import { getTimestampFromHHMM } from "@/lib/utils";
import { WorkSite } from "@/types/worksite";

export interface PlannerProps extends React.HTMLAttributes<HTMLDivElement> {
  initialEmployees: Employee[];
  initialSchedules: { data: ScheduleType[]; pagination: any };
  initialWorkSites: WorkSite[];
}

const Planner: React.FC<PlannerProps> = ({
  initialEmployees,
  initialSchedules,
  initialWorkSites,
  ...props
}) => {
  return (
    <PlannerDataContextProvider
      initialSchedules={initialSchedules}
      initialEmployees={initialEmployees}
      initialWorkSites={initialWorkSites}
    >
      <PlannerProvider>
        <PlannerMainComponent {...props} />
      </PlannerProvider>
    </PlannerDataContextProvider>
  );
};

export interface PlannerMainComponentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const PlannerMainComponent: FC<PlannerMainComponentProps> = ({ ...props }) => {
  const [filterEmployees, setFilterEmployees] = useState<boolean>(false);
  return (
    <div className="flex flex-col gap-2 w-full">
      <CalendarToolbar
        filterEmployees={filterEmployees}
        setFilterEmployees={setFilterEmployees}
      />
      <CalendarContent filterEmployees={filterEmployees} {...props} />
    </div>
  );
};

interface CalendarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  filterEmployees: boolean; // Add filterEmployees to the props
}

const CalendarContent: React.FC<CalendarContentProps> = ({
  filterEmployees,
  ...props
}) => {
  const { viewMode, dateRange, timeLabels } = useCalendar();
  const { employees, schedules, updateSchedule } = useData();

  console.log("Filter Employees:", filterEmployees); // Debugging: Check if filterEmployees is being passed correctly

  useEffect(() => {
    const cleanup = monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0]?.data;
        const sourceData = source.data;

        if (!destination || !sourceData) return;

        const schedule = schedules?.data.find(
          (schd) => schd.id === sourceData.scheduleId
        );
        if (!schedule) return;

        const newEmployee = employees?.find(
          (emp) => emp.id === destination.employee_id
        );
        if (!newEmployee) return;

        const newDates = calculateNewDates(
          viewMode,
          destination.columnIndex as unknown as number,
          sourceData.columnIndex as unknown as number,
          {
            date: schedule.date,
            from: schedule.shift_start,
            to: schedule.shift_end,
          }
        );

        updateSchedule({
          ...schedule,
          date: newDates.date,
          shift_start: newDates.start,
          shift_end: newDates.end,
          employee_id: String(newEmployee.id),
        });
      },
    });

    return cleanup;
  }, [schedules, employees, viewMode, updateSchedule]);

  const employeeSchedules = useMemo(() => {
    return employees?.map((employee) => {
      const employeeId = String(employee.id);
      const scheduleToFilter = Array.isArray(schedules)
        ? schedules
        : schedules?.data;

      // Filter schedules for the current employee
      const filteredSchedules = scheduleToFilter?.filter(
        (schd) => +schd.employee_id === +employeeId
      );

      // If filterEmployees is true, show all employees regardless of schedules
      if (filterEmployees) {
        return {
          employee,
          schedulesByTimeSlot: timeLabels.map((timeLabel, index) =>
            filteredSchedules?.filter((schd) =>
              filterSchedules(schd, timeLabel, index, dateRange, viewMode)
            )
          ),
          totalHours: 0, // Set totalHours to 0 since we're showing all employees
        };
      }

      // If filterEmployees is false, filter by timeslot (only show employees with schedules in the current timeslot)
      const schedulesByTimeSlot = timeLabels.map((timeLabel, index) =>
        filteredSchedules?.filter((schd) =>
          filterSchedules(schd, timeLabel, index, dateRange, viewMode)
        )
      );

      const totalHours = filteredSchedules?.reduce((acc, schd) => {
        const start = getTimestampFromHHMM(schd.shift_start);
        const end = getTimestampFromHHMM(schd.shift_end);
        return acc + (end - start) / (1000 * 60 * 60); // Convert milliseconds to hours
      }, 0);

      return {
        employee,
        schedulesByTimeSlot,
        totalHours,
      };
    });
  }, [employees, schedules, timeLabels, dateRange, viewMode, filterEmployees]); // Add filterEmployees as a dependency

  return (
    <div className="flex max-h-[calc(80vh_-_theme(spacing.16))] flex-col w-full">
      <Table className="min-w-[1000px]">
        <Timeline
          columnWidth="min-w-[150px] md:min-w-[150px]"
          stickyHeader={false}
          className="bg-gray-100"
        />
        <TableBody>
          {employeeSchedules?.map(
            ({ employee, schedulesByTimeSlot, totalHours }) => {
              // If filterEmployees is true, show all employees
              if (filterEmployees) {
                return (
                  <TableRow key={employee.id}>
                    <EmployeeTableCell
                      employeeItem={employee}
                      totalHours={totalHours}
                    />
                    {schedulesByTimeSlot.map((schedules, index) => (
                      <DropTableCell
                        employeeId={String(employee.id)}
                        columnIndex={index}
                        key={`${employee.id}-${index}`}
                      >
                        {schedules?.map((schd) => (
                          <Schedule
                            Schedule={schd}
                            columnIndex={index}
                            employeeId={String(employee.id)}
                            key={schd.id}
                          />
                        ))}
                      </DropTableCell>
                    ))}
                  </TableRow>
                );
              }

              // If filterEmployees is false, only show employees with schedules in the current timeslot
              if (totalHours !== 0) {
                return (
                  <TableRow key={employee.id}>
                    <EmployeeTableCell
                      employeeItem={employee}
                      totalHours={totalHours}
                    />
                    {schedulesByTimeSlot.map((schedules, index) => (
                      <DropTableCell
                        employeeId={String(employee.id)}
                        columnIndex={index}
                        key={`${employee.id}-${index}`}
                      >
                        {schedules?.map((schd) => (
                          <Schedule
                            Schedule={schd}
                            columnIndex={index}
                            employeeId={String(employee.id)}
                            key={schd.id}
                          />
                        ))}
                      </DropTableCell>
                    ))}
                  </TableRow>
                );
              }

              return null; // Skip employees with no schedules
            }
          )}
        </TableBody>
      </Table>
    </div>
  );
};
export default Planner;
