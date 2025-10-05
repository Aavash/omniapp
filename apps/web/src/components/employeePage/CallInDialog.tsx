import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/utils/fetchInterceptor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShiftScheduleItem } from "./EmployeeDashboard";

type CallInDialogProps = {
  shift: ShiftScheduleItem | null;
  disabled: boolean;
};

export const CallInDialog = ({ shift, disabled }: CallInDialogProps) => {
  const [callInReason, setCallInReason] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  console.log(shift);
  const callInMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!shift) throw new Error("No shift selected");

      const response = await fetchApi(`/api/shift/${shift.id}/call-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_in_reason: reason }),
      });
      if (!response.ok) throw new Error("Failed to submit call-in");
      return response.json();
    },
    onSuccess: () => {
      setIsOpen(false);
      setCallInReason("");
      alert("Call-in submitted successfully");
    },
    onError: (error) => {
      console.error("Error submitting call-in:", error);
      alert("Failed to submit call-in. Please try again.");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full md:w-48 bg-yellow-400 hover:bg-yellow-500 text-white"
          disabled={disabled}
        >
          Call In
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Call In Reason</DialogTitle>
          <DialogDescription>
            Please provide a reason for calling in today.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Reason
            </Label>
            <Input
              id="reason"
              value={callInReason}
              onChange={(e) => setCallInReason(e.target.value)}
              className="col-span-3"
              placeholder="Enter your reason for calling in"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => callInMutation.mutate(callInReason)}
            disabled={!callInReason || callInMutation.isPending}
          >
            {callInMutation.isPending ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
