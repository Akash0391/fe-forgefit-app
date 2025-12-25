"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { workoutApi } from "@/lib/api";

interface DiscardWorkoutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  message?: string;
}

export default function DiscardWorkoutModal({
  open,
  onClose,
  onConfirm,
  message = "Are you sure you want to discard this workout?",
}: DiscardWorkoutModalProps) {
  const handleConfirmDiscard = async () => {
    try {
      // Discard workout on backend
      await workoutApi.discard();
      
      // Clear workout in progress flag and start time to reset timer
      localStorage.removeItem("workoutInProgress");
      localStorage.removeItem("workoutStartTime");
      
      // Call custom onConfirm callback if provided
      if (onConfirm) {
        onConfirm();
      }
      
      onClose();
    } catch (error) {
      console.error("Error discarding workout:", error);
      // Even if API call fails, clear local state
      localStorage.removeItem("workoutInProgress");
      localStorage.removeItem("workoutStartTime");
      
      // Call custom onConfirm callback if provided
      if (onConfirm) {
        onConfirm();
      }
      
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-[10px] w-[360px]">
        <DialogHeader>
          <DialogTitle className="sr-only">Discard Workout</DialogTitle>
          <DialogDescription className="text-center text-sm font-regular">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            variant="default"
            onClick={handleConfirmDiscard}
            className="w-full sm:w-auto bg-gray-100 text-red-500 p-5 text-sm rounded-[10px]"
          >
            Discard Workout
          </Button>
          <Button
            variant="default"
            onClick={onClose}
            className="w-full sm:w-auto bg-gray-100 text-black p-5 text-sm rounded-[10px]"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

