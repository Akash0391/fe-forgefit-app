"use client";

import { useEffect, useState, useRef } from "react";
import { Check, Dumbbell } from "lucide-react";
import { Exercise } from "@/lib/api";

interface AddToSupersetModalProps {
  open: boolean;
  onClose: () => void;
  exercises: Exercise[];
  currentExercise: Exercise | null;
  onConfirm: (selectedExerciseIds: string[]) => void;
}

export default function AddToSupersetModal({
  open,
  onClose,
  exercises,
  currentExercise,
  onConfirm,
}: AddToSupersetModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Initialize with current exercise selected
      if (currentExercise) {
        setSelectedExercises(new Set([currentExercise._id]));
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
        setSelectedExercises(new Set());
      }, 300); // Match the transition duration
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open, currentExercise]);

  if (!shouldRender) return null;

  const handleExerciseClick = (exerciseId: string) => {
    // Don't allow clicking the current exercise
    if (exerciseId === currentExercise?._id) {
      return;
    }

    // Add the clicked exercise to the selected exercises and immediately confirm
    const updatedSelected = new Set(selectedExercises);
    updatedSelected.add(exerciseId);
    
    // Immediately confirm and close
    onConfirm(Array.from(updatedSelected));
    onClose();
  };

  // Format exercise name with equipment in parentheses if available
  const formatExerciseName = (exercise: Exercise) => {
    const name = exercise.name;
    const equipment = exercise.equipment;

    if (equipment && equipment !== "bodyweight" && equipment !== "other") {
      const equipmentFormatted =
        equipment.charAt(0).toUpperCase() + equipment.slice(1);
      if (!name.toLowerCase().includes(equipment.toLowerCase())) {
        return `${name} (${equipmentFormatted})`;
      }
    }
    return name;
  };

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
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-100 rounded-t-[30px] shadow-lg transition-all duration-300 ease-in-out min-h-[60vh] max-h-[95vh] flex flex-col ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 mb-4 items-center justify-center border-b flex flex-col">
          <h2 className="text-xl font-regular text-black">Superset</h2>
          <p className="text-lg font-regular text-gray-500 mt-1">
            {currentExercise 
              ? `Superset ${formatExerciseName(currentExercise)} with...`
              : "Select exercises to group together"}
          </p>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="overflow-hidden">
            {exercises.map((exercise, index) => {
              const isSelected = selectedExercises.has(exercise._id);
              const isCurrentExercise = exercise._id === currentExercise?._id;

              return (
                <button
                  key={exercise._id}
                  onClick={() => handleExerciseClick(exercise._id)}
                  disabled={isCurrentExercise}
                  className={`w-full flex items-center gap-4 py-4 transition-colors text-left ${
                    index !== exercises.length - 1 ? "border-b border-gray-100" : ""
                  } ${
                    isCurrentExercise
                      ? "cursor-default"
                      : "hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                  }`}
                >
                  {/* Exercise Thumbnail */}
                  <div className="relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100">   
                    {exercise.thumbnailUrl ? (
                      <img
                        src={exercise.thumbnailUrl}
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Dumbbell className="size-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Exercise Name */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-regular text-gray-900 truncate">
                      {formatExerciseName(exercise)}
                    </h3>
                  </div>

                  {/* Checkmark */}
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <Check className="size-7 text-blue-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

