"use client";

import { useEffect, useState, useRef } from "react";
import { Edit, Trash2, Share, Copy, Pencil, X } from "lucide-react";
import { Workout } from "@/lib/api";

interface RoutineOptionsModalProps {
  open: boolean;
  onClose: () => void;
  routine: Workout | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onDuplicate?: () => void;
}

export default function RoutineOptionsModal({
  open,
  onClose,
  routine,
  onEdit,
  onDelete,
  onShare,
  onDuplicate,
}: RoutineOptionsModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Mount the component first
      setShouldRender(true);
      // Small delay to ensure DOM is ready before starting transition
      setTimeout(() => {
        setIsVisible(true);
      }, 10);
    } else {
      // Start closing transition immediately
      setIsVisible(false);
      // Delay unmounting to allow transition to complete
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match the transition duration
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open]);

  if (!shouldRender) return null;

  const menuItems = [
    {
      icon: Share,
      label: "Share Routine",
      onClick: onShare,
    },
    {
      icon: Copy,
      label: "Duplicate Routine",
      onClick: onDuplicate,
    },
    {
      icon: Pencil,
      label: "Edit Routine",
      onClick: onEdit,
    },
    {
      icon: X,
      label: "Delete Routine",
      onClick: onDelete,
      textColor: "text-red-500",
    },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ease-in-out ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        style={{ pointerEvents: isVisible ? "auto" : "none" }}
      />
      {/* Modal Content - Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-[30px] shadow-lg transition-all duration-300 ease-in-out min-h-[40vh] ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-2">
          <div className="h-1 w-15 bg-gray-400 rounded-lg"></div>
        </div>
        
        {/* Header with Routine Title */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-regular text-center">
            {routine?.name}
          </h2>
        </div>

        <div className="px-6 py-6 pb-8">
          <div className="dark:bg-gray-600 bg-gray-100 rounded-[10px] overflow-hidden">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === menuItems.length - 1;
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    }
                    // Don't close modal for delete button - let the delete confirmation modal handle it
                    if (item.label !== "Delete Routine") {
                      onClose();
                    }
                  }}
                  className={`w-full flex items-center gap-5 px-5 py-5 transition-colors text-left ${
                    !isLast ? "border-b border-gray-100 dark:border-gray-700" : ""
                  } hover:bg-gray-50 active:bg-gray-100`}
                >
                  <Icon className={`size-5 ${item.textColor} flex-shrink-0`} />
                  <span className={`text-sm font-regular ${item.textColor}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

