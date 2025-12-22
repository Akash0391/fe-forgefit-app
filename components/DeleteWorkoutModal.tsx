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

interface DeleteWorkoutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  message?: string;
}

export default function DeleteWorkoutModal({
  open,
  onClose,
  onConfirm,
  message = "Are you sure you want to delete this workout?",
}: DeleteWorkoutModalProps) {
  const handleConfirmDelete = async () => {
    // Call custom onConfirm callback if provided
    if (onConfirm) {
      onConfirm();
    }
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-[10px] w-[360px]">
        <DialogHeader>
          <DialogTitle className="sr-only">Delete Workout</DialogTitle>
          <DialogDescription className="text-center text-sm font-regular">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="default"
            onClick={handleConfirmDelete}
            className="w-full sm:w-auto bg-gray-100 text-red-500 p-6 text-sm rounded-[10px]"
          >
            Delete Workout
          </Button>
          <Button
            variant="default"
            onClick={onClose}
            className="w-full sm:w-auto bg-gray-100 text-black p-6 text-sm rounded-[10px]"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

