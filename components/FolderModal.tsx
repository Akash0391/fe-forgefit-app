"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FolderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function FolderModal({ open, onClose, onSave }: FolderModalProps) {
  const [name, setName] = useState("");

  // reset name whenever modal opens
  useEffect(() => {
    if (open) setName("");
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* Modal card */}
      <div className="w-[90%] rounded-[10px] dark:bg-gray-800 bg-gray-100 px-6 py-6 md:px-8 md:py-8">
        {/* Title */}
        <h2 className="text-center text-sm md:text-xl font-semibold mb-6">
          Create New Folder
        </h2>

        {/* Input */}
        <div className="mb-6">
          <Input
            placeholder="New Folder"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-16 text-sm placeholder:text-gray-400 dark:bg-gray-600 bg-gray-200 md:text-lg px-6 rounded-[8px]"
          />
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          <Button
            className="w-full h-10 bg-blue-500 md:h-12 text-sm md:text-lg rounded-[10px]"
            onClick={handleSave}
          >
            Save
          </Button>
          <Button
            variant="outline"
            className="w-full h-10 md:h-12 text-sm md:text-lg rounded-[10px] bg-gray-300 dark:bg-gray-700 border-0"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
