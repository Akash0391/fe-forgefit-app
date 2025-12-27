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
import { socket } from "@/lib/socket";

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
  const cleanupWorkoutState = () => {
    console.log("🧹 Cleaning workout state (discard)");

    sessionStorage.removeItem("draftWorkoutId");
    localStorage.removeItem("workoutInProgress");
    localStorage.removeItem("workoutStartTime");

    try {
      socket.off("workout:update");
      socket.off("workout:complete");
      socket.disconnect();
    } catch (_) {}
  };

  const handleConfirmDiscard = async () => {
    try {
      await workoutApi.discard();
    } catch (error) {
      console.error("❌ Discard API failed (continuing cleanup):", error);
    }

    cleanupWorkoutState();

    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-[10px] w-[360px]">
        <DialogHeader>
          <DialogTitle className="sr-only">Discard Workout</DialogTitle>
          <DialogDescription className="text-center dark:text-white text-sm font-regular">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            variant="default"
            onClick={handleConfirmDiscard}
            className="w-full sm:w-auto bg-gray-100 dark:bg-blue-500 text-red-500 dark:text-white p-5 text-sm rounded-[10px]"
          >
            Discard Workout
          </Button>
          <Button
            variant="default"
            onClick={onClose}
            className="w-full sm:w-auto bg-gray-100 dark:bg-gray-500 text-black dark:text-white p-5 text-sm rounded-[10px]"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

