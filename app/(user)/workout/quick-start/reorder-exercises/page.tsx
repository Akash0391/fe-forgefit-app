"use client";

import { useState, useEffect } from "react";
import { Dumbbell, Minus, Circle } from "lucide-react";
import { Exercise } from "@/lib/api";

export default function ReorderExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Load exercises from localStorage
  useEffect(() => {
    const exercisesJson = localStorage.getItem("workoutExercises");
    if (exercisesJson) {
      try {
        const loadedExercises = JSON.parse(exercisesJson);
        setExercises(loadedExercises);
      } catch (error) {
        console.error("Error parsing workout exercises:", error);
        setExercises([]);
      }
    }
  }, []);

  // Save exercises to localStorage
  const saveExercises = (newExercises: Exercise[]) => {
    localStorage.setItem("workoutExercises", JSON.stringify(newExercises));
    // Dispatch custom event to notify other tabs/components
    window.dispatchEvent(new Event("workoutExercisesUpdated"));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newExercises = [...exercises];
    const draggedExercise = newExercises[draggedIndex];

    // Remove the dragged item
    newExercises.splice(draggedIndex, 1);

    // Insert at new position
    newExercises.splice(dropIndex, 0, draggedExercise);

    setExercises(newExercises);
    saveExercises(newExercises);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-center h-16 px-4">
          {/* Center: Title */}
          <h1 className="text-lg font-regular text-center">
            Reorder
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-1 pb-6">
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12">
            <Dumbbell className="size-[36px] text-gray-300 mb-6 stroke-[1.5]" />
            <h2 className="text-xl font-bold mb-2">No exercises</h2>
            <p className="text-muted-foreground text-sm text-center">
              Add exercises to your workout first
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map((exercise, index) => (
              <div
                key={exercise._id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-center gap-4 p-4 bg-white rounded-[10px] border-2 transition-all
                  ${
                    draggedIndex === index
                      ? "opacity-50 border-blue-500"
                      : "border-transparent"
                  }
                  ${
                    dragOverIndex === index && draggedIndex !== index
                      ? "border-blue-300 bg-blue-50"
                      : ""
                  }
                  ${
                    draggedIndex !== index ? "cursor-move hover:bg-gray-50" : ""
                  }
                `}
              >
                {/* Remove Button */}
                <div className="flex-shrink-0 relative">
                  <Circle className="size-7 fill-red-500 text-red-500" />
                  <Minus className="size-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white stroke-[3]" />
                </div>

                {/* Exercise Icon */}
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
                  <h3 className="text-lg font-regular text-black truncate">
                    {formatExerciseName(exercise)}
                  </h3>
                </div>

                {/* Drag Handle - Three Horizontal Lines */}
                <div className="flex-shrink-0 text-gray-400 flex flex-col gap-1.5">
                  <div className="w-7 h-0.5 bg-gray-400"></div>
                  <div className="w-7 h-0.5 bg-gray-400"></div>     
                  <div className="w-7 h-0.5 bg-gray-400"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
