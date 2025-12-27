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

interface DeleteRoutineModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  routineName?: string;
}

export default function DeleteRoutineModal({
  open,
  onClose,
  onConfirm,
  routineName = "this routine",
}: DeleteRoutineModalProps) {
  const handleConfirmDelete = async () => {
    await onConfirm();
    // Parent component will handle closing the modal
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-[10px] w-[360px] dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="sr-only">Delete Routine</DialogTitle>
          <DialogDescription className="text-center text-sm dark:text-white font-regular">
            Are you sure you want to delete this routine?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            variant="default"
            onClick={handleConfirmDelete}
            className="w-full sm:w-auto bg-gray-100 dark:bg-red-500 text-red-500 dark:text-white p-5 text-sm rounded-[10px]"
          >
            Delete Routine
          </Button>
          <Button
            variant="default"
            onClick={onClose}
            className="w-full sm:w-auto bg-gray-100 dark:bg-gray-700 text-black dark:text-white p-5 text-sm rounded-[10px]"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

