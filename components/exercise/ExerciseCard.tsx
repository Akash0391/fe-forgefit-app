"use client";

import React, { useState } from "react";
import { Dumbbell, TrendingUp } from "lucide-react";
import { Exercise } from "@/lib/api";

interface ExerciseCardProps {
  exercise: Exercise;
  isSelected?: boolean;
  onClick?: () => void;
  onVideoClick?: (e: React.MouseEvent) => void;

  // NEW (optional) – used only for custom exercises
  variant?: "default" | "custom";
  displayTitle?: string; // e.g. "Chest" instead of "Chest (Dumbbell)"
}

export function ExerciseCard({
  exercise,
  isSelected = false,
  onClick,
  onVideoClick,
  variant = "default",
  displayTitle,
}: ExerciseCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const mediaUrl = exercise.thumbnailUrl;

  const isCustom = variant === "custom";

  // Name formatting
  const formatExerciseName = () => {
    // For custom list we trust the parent to send the cleaned title
    if (isCustom && displayTitle) return displayTitle;
    if (isCustom) return exercise.name;

    // DEFAULT behaviour (for All Exercises)
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

  // Primary muscle group (first one)
  const primaryMuscleGroup =
    exercise.muscleGroups.length > 0
      ? exercise.muscleGroups[0].charAt(0).toUpperCase() +
        exercise.muscleGroups[0].slice(1)
      : "";

  return (
    <div
      className="bg-white border-b border-gray-200 py-3 pr-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-3 relative"
      onClick={onClick}
    >
      {/* Blue vertical line indicator when selected */}
      <div
        className={`absolute left-0 top-0 bottom-0 bg-blue-600 rounded-full transition-all duration-300 ease-in-out ${
          isSelected ? "opacity-100 w-1.5" : "opacity-0 w-0"
        }`}
      />

      {/* Content wrapper that shifts when selected */}
      <div
        className={`flex items-center gap-3 flex-1 transition-all duration-300 ease-in-out ${
          isSelected ? "pl-4" : "pl-0"
        }`}
      >
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
                onError={() => {
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
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-base font-regular text-gray-500">
                {primaryMuscleGroup}
              </p>

              {isCustom && (
                <span className="px-3 py-0.5 text-lg rounded-[10px] border border-blue-100 bg-black text-white font-medium">
                  Custom
                </span>
              )}
            </div>
          )}
        </div>

        {/* Icon Button on Right */}
        <div
          className="flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onVideoClick?.(e);
          }}
        >
          <div className="w-8 h-8 border border-black rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <TrendingUp className="size-7 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
