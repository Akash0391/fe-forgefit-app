"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUpDown, RefreshCw, Plus, X, Minus } from "lucide-react";
import { Exercise } from "@/lib/api";

interface ExerciseOptionsModalProps {
  open: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  onReorder: () => void;
  onReplace: () => void;
  onAddToSuperset: () => void;
  onRemoveFromSuperset: () => void;
  onRemove: () => void;
  isInSuperset?: boolean;
}

export default function ExerciseOptionsModal({
  open,
  onClose,
  exercise,
  onReorder,
  onReplace,
  onAddToSuperset,
  onRemoveFromSuperset,
  onRemove,
  isInSuperset = false,
}: ExerciseOptionsModalProps) {
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
      icon: ArrowUpDown,
      label: "Reorder Exercises",
      onClick: onReorder,
      textColor: "text-gray-900",
    },
    {
      icon: RefreshCw,
      label: "Replace Exercise",
      onClick: onReplace,
      textColor: "text-gray-900",
    },
    {
      icon: isInSuperset ? Minus : Plus,
      label: isInSuperset ? "Remove From Superset" : "Add To Superset",
      onClick: isInSuperset ? onRemoveFromSuperset : onAddToSuperset,
      textColor: "text-gray-900",
    },
    {
      icon: X,
      label: "Remove Exercise",
      onClick: onRemove,
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
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-100 rounded-t-[30px] shadow-lg transition-all duration-300 ease-in-out min-h-[40vh] ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-10 pb-8">
          <div className="bg-white rounded-[10px] overflow-hidden">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === menuItems.length - 1;
              return (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick();
                    // Only close if it's not "Add To Superset" - that modal will handle closing
                    // "Remove From Superset" closes immediately
                    if (item.label !== "Add To Superset") {
                      onClose();
                    }
                  }}
                  className={`w-full flex items-center gap-5 px-6 py-6 transition-colors text-left ${
                    !isLast ? "border-b border-gray-100" : ""
                  } hover:bg-gray-50 active:bg-gray-100`}
                >
                  <Icon className={`size-7 ${item.textColor} flex-shrink-0`} />
                  <span className={`text-lg font-regular ${item.textColor}`}>
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

