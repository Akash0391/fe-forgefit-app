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
      <DialogContent className="rounded-[10px] w-[360px]">
        <DialogHeader>
          <DialogTitle className="sr-only">Delete Routine</DialogTitle>
          <DialogDescription className="text-center text-lg font-regular">
            Are you sure you want to delete this routine?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-5">
          <Button
            variant="default"
            onClick={handleConfirmDelete}
            className="w-full sm:w-auto bg-gray-100 text-red-500 p-6 text-lg rounded-[10px]"
          >
            Delete Routine
          </Button>
          <Button
            variant="default"
            onClick={onClose}
            className="w-full sm:w-auto bg-gray-100 text-black p-6 text-lg rounded-[10px]"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

