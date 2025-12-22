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

interface FinishWorkoutConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export default function FinishWorkoutConfirmationModal({
  open,
  onClose,
  message = "Add an exercise",
}: FinishWorkoutConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-[10px] w-[360px]">
        <DialogHeader>
          <DialogTitle className="sr-only">Finish Workout</DialogTitle>
          <DialogDescription className="text-center text-lg font-regular mb-4">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-5">
          <Button
            variant="default"
            onClick={onClose}
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white p-6 text-lg rounded-[10px]"
          >
            Ok
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

