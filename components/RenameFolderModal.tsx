"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RenameFolderModalProps {
  open: boolean;
  currentName: string; 
  onClose: () => void;
  onSave: (name: string) => void;
}

export function RenameFolderModal({ open, currentName, onClose, onSave }: RenameFolderModalProps) {
  const [name, setName] = useState("");

  // reset name whenever modal opens
  useEffect(() => {
    if (open) setName("");   // ✅ prefill
  }, [open, currentName]);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);   // parent decides when to close
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* Modal card */}
      <div className="w-[90%] rounded-[10px] bg-white px-6 py-6 md:px-8 md:py-8">
        {/* Title */}
        <h2 className="text-center text-lg md:text-xl font-semibold mb-6">
          Rename Folder
        </h2>

        {/* Input */}
        <div className="mb-6">
          <Input
            placeholder={currentName || "Folder Name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-20 text-lg placeholder:text-gray-400 md:text-lg px-6 rounded-[8px]"
          />
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          <Button
            className="w-full h-13 bg-blue-500 md:h-12 text-lg md:text-lg rounded-[10px]"
            onClick={handleSave}
          >
            Save
          </Button>
          <Button
            variant="outline"
            className="w-full h-13 md:h-12 text-lg md:text-lg rounded-[10px] bg-gray-100 hover:bg-gray-200 border-0 text-gray-900"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
