"use client";

import { Dumbbell, TrendingUp } from "lucide-react";
import { Exercise } from "@/lib/api";
import { useState } from "react";

interface ExerciseCardProps {
  exercise: Exercise;
  onClick?: () => void;
}

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const mediaUrl =
    exercise.gifUrl || exercise.videoUrl || exercise.thumbnailUrl;

  // Format exercise name with equipment in parentheses if available
  const formatExerciseName = () => {
    const name = exercise.name;
    const equipment = exercise.equipment;

    // If equipment is not "bodyweight" and not already in the name, add it
    if (equipment && equipment !== "bodyweight" && equipment !== "other") {
      const equipmentFormatted =
        equipment.charAt(0).toUpperCase() + equipment.slice(1);
      if (!name.toLowerCase().includes(equipment.toLowerCase())) {
        return `${name} (${equipmentFormatted})`;
      }
    }
    return name;
  };

  // Get primary muscle group (first one)
  const primaryMuscleGroup =
    exercise.muscleGroups.length > 0
      ? exercise.muscleGroups[0].charAt(0).toUpperCase() +
        exercise.muscleGroups[0].slice(1)
      : "";

  return (
    <div className="bg-white border-b border-gray-200 p-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-3">
      {/* Circular Image/GIF on Left */}
      <div className="relative flex-shrink-0 w-20 h-20 rounded-full overflow-hidden bg-gray-100">
        {mediaUrl && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <Dumbbell className="size-6 text-gray-400 animate-pulse" />
              </div>
            )}
            <img
              src={mediaUrl}
              alt={exercise.name}
              className={`w-full h-full object-cover ${
                imageLoading ? "opacity-0" : "opacity-100"
              } transition-opacity duration-300`}
              onLoad={() => setImageLoading(false)}
              onError={(e) => {
                console.error("Failed to load image:", mediaUrl);
                setImageError(true);
                setImageLoading(false);
              }}
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Dumbbell className="size-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Exercise Name and Muscle Group in Middle */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-regular text-black truncate">
          {formatExerciseName()}
        </h3>
        {primaryMuscleGroup && (
          <p className="text-base font-regular text-gray-500 mt-0.5">
            {primaryMuscleGroup}
          </p>
        )}
      </div>

      {/* Icon Button on Right */}
      <div className="flex-shrink-0" onClick={onClick}>
        <div className="w-8 h-8 border border-black rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <TrendingUp className="size-7 text-gray-600" />
        </div>
      </div>
    </div>
  );
}
