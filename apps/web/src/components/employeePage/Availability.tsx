import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/utils/fetchInterceptor";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/hooks/auth";

type DayAvailability = {
  available: boolean;
  start_time: string | null;
  end_time: string | null;
};

type ApiAvailability = {
  [key: string]: DayAvailability;
};

type AvailabilityResponse = {
  id: number;
  user_id: number;
  organization_id: number;
  availability: ApiAvailability;
  notes: string;
};

const defaultAvailability: ApiAvailability = {
  sunday: { available: false, start_time: null, end_time: null },
  monday: { available: true, start_time: "09:00", end_time: "17:00" },
  tuesday: { available: true, start_time: "09:00", end_time: "17:00" },
  wednesday: { available: true, start_time: "09:00", end_time: "17:00" },
  thursday: { available: true, start_time: "09:00", end_time: "17:00" },
  friday: { available: true, start_time: "09:00", end_time: "17:00" },
  saturday: { available: false, start_time: null, end_time: null },
};

export function Availability() {
  const { userData } = useAuth();
  const [localAvailability, setLocalAvailability] =
    useState<ApiAvailability>(defaultAvailability);
  const [notes, setNotes] = useState(
    "Standard working hours from Monday to Friday."
  );
  const [isEditing, setIsEditing] = useState(false);
  console.log(userData);
  // Fetch current availability
  const { data, isLoading, isError, error } =
    useQuery<AvailabilityResponse | null>({
      queryKey: ["availability"],
      queryFn: async () => {
        try {
          const response = await fetchApi("/api/availability/my-availability");

          if (!response.ok) {
            if (response.status === 404) {
              const errorData = await response.json();
              if (errorData.detail === "Availability record not found") {
                return null;
              }
            }
            throw new Error("Failed to fetch availability");
          }

          return await response.json();
        } catch (err) {
          throw err;
        }
      },
    });

  // Mutation for saving availability
  const saveMutation = useMutation({
    mutationFn: (availabilityData: any) => {
      if (!userData.id) {
        throw new Error("User ID not available");
      }
      return fetchApi(`/api/availability/${userData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...availabilityData,
          notes: availabilityData.notes,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Availability saved successfully");
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save availability");
    },
  });

  // Initialize local state when data loads
  useEffect(() => {
    if (data) {
      setLocalAvailability(data.availability);
      setNotes(data.notes);
    } else {
      setLocalAvailability(defaultAvailability);
      setNotes("Standard working hours from Monday to Friday.");
    }
  }, [data]);

  const handleToggleDay = (day: string) => {
    setLocalAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        available: !prev[day].available,
        start_time: prev[day].available ? null : "09:00",
        end_time: prev[day].available ? null : "17:00",
      },
    }));
    setIsEditing(true);
  };

  const handleTimeChange = (
    day: string,
    field: "start_time" | "end_time",
    value: string
  ) => {
    setLocalAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
    setIsEditing(true);
  };

  const handleReset = () => {
    if (data) {
      setLocalAvailability(data.availability);
      setNotes(data.notes);
    } else {
      setLocalAvailability(defaultAvailability);
      setNotes("Standard working hours from Monday to Friday.");
    }
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!userData.id) {
      toast.error("User ID not available");
      return;
    }

    const availabilityData = {
      ...localAvailability,
      notes,
    };
    saveMutation.mutate(availabilityData);
  };

  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error instanceof Error
          ? error.message
          : "Failed to load availability data"}
      </div>
    );
  }

  return (
    <Card>
      <Toaster />
      <CardHeader>
        <CardTitle className="text-2xl">Weekly Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Week Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(localAvailability).map(([day, availability]) => (
              <div key={day} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={availability.available}
                      onChange={() => handleToggleDay(day)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium">{formatDayName(day)}</span>
                  </label>
                </div>

                {availability.available ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 rounded-md border p-2">
                      <div className="flex flex-1 items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <input
                          type="time"
                          value={availability.start_time || ""}
                          onChange={(e) =>
                            handleTimeChange(day, "start_time", e.target.value)
                          }
                          className="w-full rounded border p-1.5 text-sm"
                        />
                        <span className="text-muted-foreground">to</span>
                        <input
                          type="time"
                          value={availability.end_time || ""}
                          onChange={(e) =>
                            handleTimeChange(day, "end_time", e.target.value)
                          }
                          className="w-full rounded border p-1.5 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Not available
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Notes Field */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setIsEditing(true);
              }}
              className="w-full rounded-md border p-2 text-sm"
              rows={3}
              placeholder="Additional information about your availability..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!isEditing || saveMutation.isPending}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isEditing || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
