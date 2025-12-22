"use client";

import { useEffect, useState, useRef } from "react";
import { Edit, Trash2, Share, Eye, EyeOff, Download, Copy, Pencil, X } from "lucide-react";
import { Workout } from "@/lib/api";

interface WorkoutOptionsModalProps {
  open: boolean;
  onClose: () => void;
  workout: Workout | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onCopy?: () => void;
  onToggleVisibility?: () => void;
  onSaveAsRoutine?: () => void; // New prop to handle save as routine
  onDeleteClick?: () => void; // New prop to handle delete button click without closing modal
}

export default function WorkoutOptionsModal({
  open,
  onClose,
  workout,
  onEdit,
  onDelete,
  onShare,
  onCopy,
  onToggleVisibility,
  onSaveAsRoutine,
  onDeleteClick,
}: WorkoutOptionsModalProps) {
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
      // This allows the closing state to be rendered first, then transition to open
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
      label: "Share Workout",
      onClick: onShare,
      textColor: "text-gray-900",
    },
    {
      icon: Download,
      label: "Save as Routine",
      onClick: onSaveAsRoutine || onToggleVisibility,
      textColor: "text-gray-900",
    },
    {
      icon: Copy,
      label: "Copy Workout",
      onClick: onCopy,
      textColor: "text-gray-900",
    },
    {
      icon: Pencil,
      label: "Edit Workout",
      onClick: onEdit,
      textColor: "text-gray-900",
    },
    {
        icon: X,
        label: "Delete Workout",
        onClick: onDelete,
        textColor: "text-red-500",
    }
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
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-100 rounded-t-[30px] shadow-lg transition-all duration-300 ease-in-out min-h-[40vh] ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-2">
          <div className="h-1.5 w-17 bg-gray-400 rounded-lg"></div>
        </div>
        <div className="px-6 py-7 pb-8">
          <div className="bg-white rounded-[10px] overflow-hidden">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === menuItems.length - 1;
              return (
                <button
                  key={index}
                  onClick={() => {
                    // For delete button, use onDeleteClick if provided (to open delete modal)
                    // Otherwise use onDelete
                    if (item.label === "Delete Workout" && onDeleteClick) {
                      onDeleteClick();
                    } else if (item.onClick) {
                      item.onClick();
                    }
                    // Don't close modal for delete button - let the delete modal handle it
                    if (item.label !== "Delete Workout") {
                      onClose();
                    }
                  }}
                  className={`w-full flex items-center gap-5 px-5 py-5 transition-colors text-left ${
                    !isLast ? "border-b border-gray-100" : ""
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

