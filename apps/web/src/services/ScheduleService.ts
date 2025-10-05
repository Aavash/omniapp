import { Schedule } from "@/models";
import { fetchApi } from "@/utils/fetchInterceptor";
import { useQuery } from "@tanstack/react-query";

export class ScheduleService {
  private schedules: { data: Schedule[]; pagination: any };

  constructor(initialSchedules: { data: Schedule[]; pagination: any }) {
    this.schedules = initialSchedules;
  }

  async createSchedule(
    schedule: Schedule
  ): Promise<{ data: Schedule[]; pagination: any }> {
    try {
      const response = await fetchApi("/api/shift/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(schedule),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.detail) {
          throw new Error(errorData.detail);
        } else {
          throw new Error("Failed to create schedule");
        }
      }

      const newSchedule = await response.json();
      this.schedules.data.push(newSchedule);
      return this.schedules;
    } catch (error) {
      throw error;
    }
  }

  // Update an existing schedule by making a PUT request to the backend
  async updateSchedule(
    updatedSchedule: Schedule
  ): Promise<{ data: Schedule[]; pagination: any }> {
    try {
      const response = await fetchApi(`/api/shift/edit/${updatedSchedule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSchedule),
      });

      if (!response.ok) {
        throw new Error("Failed to update schedule");
      }

      const updatedScheduleFromServer = await response.json();
      const index = this.schedules.data.findIndex(
        (a) => a.id === updatedSchedule.id
      );
      if (index !== -1) {
        this.schedules.data[index] = {
          ...this.schedules.data[index],
          ...updatedScheduleFromServer,
        };
      }
      return this.schedules;
    } catch (error) {
      console.error("Error updating schedule:", error);
      throw error;
    }
  }

  // Delete a schedule by making a DELETE request to the backend
  async deleteSchedule(
    id: string
  ): Promise<{ data: Schedule[]; pagination: any }> {
    try {
      const response = await fetchApi(`/api/shift/delete/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete schedule");
      }

      this.schedules.data = this.schedules.data.filter((a) => a.id !== id); // Filter out the deleted schedule
      return this.schedules;
    } catch (error) {
      console.error("Error deleting schedule:", error);
      throw error;
    }
  }

  // Fetch schedules from the backend
  async getSchedules(params?: {
    dateRange?: { from?: Date; to?: Date };
    workSiteId?: number | null;
  }): Promise<{ data: Schedule[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.dateRange?.from && params.dateRange.to) {
        queryParams.append(
          "week_start",
          params.dateRange?.from?.toISOString().split("T")[0]
        );
        queryParams.append(
          "week_end",
          params.dateRange?.to?.toISOString().split("T")[0]
        );
      }

      if (params?.workSiteId !== undefined && params.workSiteId !== null) {
        queryParams.append("worksite_id", params.workSiteId.toString());
      }

      const apiUrl = `/api/shift/list${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await fetchApi(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching schedules:", error);
      throw error;
    }
  }
}
// Custom hook to fetch schedules
const useSchedules = () => {
  return useQuery({
    queryKey: ["schedules"], // Unique key for caching
    queryFn: async () => {
      const scheduleService = new ScheduleService({ data: [], pagination: {} }); // Initialize with empty data and pagination
      return await scheduleService.getSchedules();
    },
  });
};
