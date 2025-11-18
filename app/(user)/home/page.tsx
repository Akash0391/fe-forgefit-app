"use client";

import { useEffect, useState } from "react";
import { workoutApi, Workout, SetData } from "@/lib/api";
import { Calendar, Clock, Dumbbell, TrendingUp } from "lucide-react";

export default function HomePage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const response = await workoutApi.getHistory();
      if (response.success) {
        setWorkouts(response.data);
      }
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `0min`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const calculateTotalVolume = (workout: Workout): number => {
    let totalVolume = 0;
    workout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set: SetData) => {
        if (set.kg > 0 && set.reps > 0) {
          totalVolume += set.kg * set.reps;
        }
      });
    });
    return totalVolume;
  };

  const calculateTotalSets = (workout: Workout): number => {
    let totalSets = 0;
    workout.exercises.forEach((exercise) => {
      totalSets += exercise.sets.length;
    });
    return totalSets;
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${day} ${month} ${year}, ${hours}:${minutesStr} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading workouts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-lg font-semibold">Workout History</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="size-12 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No workouts yet</h2>
            <p className="text-muted-foreground text-center">
              Complete a workout to see it here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => {
              const totalVolume = calculateTotalVolume(workout);
              const totalSets = calculateTotalSets(workout);
              const exerciseCount = workout.exercises.length;

              return (
                <div
                  key={workout._id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Workout Name */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {workout.name || "Quick Start Workout"}
                  </h3>

                  {/* Workout Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm font-semibold text-blue-500">
                          {formatDuration(workout.duration)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Volume</p>
                        <p className="text-sm font-semibold">
                          {totalVolume} kg
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="size-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Sets</p>
                        <p className="text-sm font-semibold">{totalSets}</p>
                      </div>
                    </div>
                  </div>

                  {/* Exercise Count and Date */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="size-4" />
                      <span>{formatDateTime(workout.endTime || workout.startTime)}</span>
                    </div>
                  </div>

                  {/* Description if available */}
                  {workout.description && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {workout.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
