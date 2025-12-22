"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell, MoreHorizontal, Share, Timer } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Exercise, workoutApi, Workout } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DetailRoutineOptionModal from "@/components/DetailRoutineOptionModal";

interface RoutineExercise {
  exercise: Exercise;
  sets: any[];
  notes: string;
  restTimerSeconds?: number;
}

const formatRestTimerLabel = (seconds?: number): string => {
  if (!seconds || seconds === 0) return "OFF";
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;

  if (remain === 0) return `${minutes}m`;
  return `${minutes}m ${remain}s`;
};


export default function RoutineDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routineId = searchParams.get("id");
  const { user } = useAuth();
  const [routine, setRoutine] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<"Volume" | "Reps" | "Duration">("Volume");
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Workout | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  useEffect(() => {
    if (routineId) {
      loadRoutine();
    } else {
      setError("Routine ID is required");
      setIsLoading(false);
    }
  }, [routineId]);

  const formatReps = (set: any) => {
    if (set?.minReps != null && set?.maxReps != null) return `${set.minReps}-${set.maxReps}`;
    if (set?.reps != null) return String(set.reps);
    return '-';
  };


  const loadRoutine = async () => {
    if (!routineId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all routines and find the one we need
      const response = await workoutApi.getRoutines();
      const foundRoutine = response.data.find((r: Workout) => r._id === routineId);

      if (!foundRoutine) {
        setError("Routine not found");
        setIsLoading(false);
        return;
      }

      setRoutine(foundRoutine);

      // Convert routine exercises to RoutineExercise format
      const routineExercises: RoutineExercise[] = foundRoutine.exercises.map((ex: any) => {
        const exercise = typeof ex.exerciseId === 'object' ? ex.exerciseId : { _id: ex.exerciseId };
        return {
          exercise: exercise as Exercise,
          sets: ex.sets || [],
          notes: ex.notes || "",
          restTimerSeconds: ex.restTimerSeconds ?? 0,
        };
      });

      setExercises(routineExercises);
    } catch (err: any) {
      console.error("Error loading routine:", err);
      setError(err.message || "Failed to load routine. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoutineDuplicate = () => {
    if (!selectedRoutine) return;

    // Prepare routine data in the format expected by new-routine page
    const routineData = {
      name: `${selectedRoutine.name} (copy)`,
      exercises: selectedRoutine.exercises.map((ex) => {
        const exercise = typeof ex.exerciseId === 'object' ? ex.exerciseId : { _id: ex.exerciseId };
        return {
          exercise: exercise,
          sets: ex.sets || [],
          notes: ex.notes || "",
        };
      }),
      supersetGroups: selectedRoutine.supersetGroups || [],
    };

    // Store in sessionStorage for new-routine page to load
    sessionStorage.setItem("workoutToRoutine", JSON.stringify(routineData));

    // Close modal and navigate
    handleRoutineModalClose();
    router.push("/workout/new-routine");
  };

  const handleRoutineDelete = () => {
    // Show delete confirmation modal
    setShowDeleteConfirm(true);
  };

  const handleRoutineModalClose = () => {
    setShowRoutineModal(false);
    setSelectedRoutine(null);
  };

  const handleRoutineEdit = () => {
    if (!selectedRoutine) return;

    // Close modal and navigate to edit routine page
    handleRoutineModalClose();
    router.push(`/workout/edit-routine?id=${selectedRoutine._id}`);
  };

  const handleRoutineOptionsClick = (routine: Workout) => {
    setSelectedRoutine(routine);
    setShowRoutineModal(true);
  };

  
  const handleStartRoutine = () => {
    if (!routine) return;

    // Store routine data in sessionStorage to start as a workout
    const workoutData = {
      name: routine.name || "Quick Start Workout",
      exercises: routine.exercises.map((ex) => {
        const exercise = typeof ex.exerciseId === 'object' ? ex.exerciseId : { _id: ex.exerciseId };
        return {
          exercise: exercise,
          sets: ex.sets || [],
          notes: ex.notes || "",
        };
      }),
      supersetGroups: routine.supersetGroups || [],
    };

    sessionStorage.setItem("routineToWorkout", JSON.stringify(workoutData));

    // Set workout in progress and navigate to quick start
    localStorage.setItem("workoutInProgress", "true");
    router.push("/workout/quick-start");
  };

  const handleEditRoutine = () => {
    if (!routineId) return;
    router.push(`/workout/edit-routine?id=${routineId}`);
  };

  // Format exercise name with equipment in parentheses if available
  const formatExerciseName = (exercise: Exercise) => {
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

  // Generate username from email or name
  const getUsername = (): string => {
    if (user?.email) {
      return user.email.split("@")[0];
    }
    if (user?.name) {
      return user.name.split(" ")[0];
    }
    return "user";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading routine...</p>
      </div>
    );
  }

  if (error || !routine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Routine not found"}</p>
          <Button onClick={() => router.push("/workout")} variant="outline">
            Back to Workouts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
            aria-label="Go back"
          >
            <ArrowLeft className="size-7" />
          </Button>

          <h1 className="text-lg font-regular">Routine</h1>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              aria-label="More options"
            >
              <Share className="size-7" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              aria-label="More options"
              onClick={(e) => {
                            e.stopPropagation();
                            handleRoutineOptionsClick(routine);
                          }}
            >
              <MoreHorizontal className="size-7" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6 pb-20">
        {/* Routine Header */}
        <div>
          <h2 className="text-2xl font-semibold mb-2">
            {routine.name}
          </h2>
          <p className="text-gray-500 text-xm mb-4">
            Created by {getUsername()}
          </p>
          <Button
            onClick={handleStartRoutine}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg rounded-[10px] py-6"
          >
            Start Routine
          </Button>
        </div>

        {/* Data Visualization Area */}
        <div className="bg-white rounded-[10px] border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[150px]">
          <div className="text-gray-400 mb-4">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="4" height="18" rx="1" />
              <rect x="10" y="8" width="4" height="13" rx="1" />
              <rect x="17" y="13" width="4" height="8" rx="1" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg">No data yet</p>
        </div>

        {/* View Filters */}
        <div className="flex gap-4">
          {(["Volume", "Reps", "Duration"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`flex py-2 px-6 rounded-full text-xm font-medium transition-colors ${selectedView === view
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600"
                }`}
            >
              {view}
            </button>
          ))}
        </div>

        {/* Exercises Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-500">Exercises</h3>
            <button
              onClick={handleEditRoutine}
              className="text-blue-500 text-xm font-regular hover:text-blue-600"
            >
              Edit Routine
            </button>
          </div>

          {/* Exercise List */}
          <div className="space-y-4">
            {exercises.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No exercises in this routine yet.
              </div>
            ) : (
              exercises.map((routineExercise, index) => {
                const exercise = routineExercise.exercise;
                const sets = routineExercise.sets || [];

                return (
                  <div
                    key={exercise._id || index}
                    className="bg-white"
                  >
                    {/* Exercise Header */}
                    <div className="flex items-center gap-5 mb-2">
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
                      <h4 className="text-lg font-semibold flex-1">
                        {formatExerciseName(exercise)}
                      </h4>
                    </div>

                    <div
                      className="flex items-center gap-2 mb-5 mt-5 cursor-pointer hover:opacity-80 transition-opacity active:opacity-70"
                    >
                      <Timer className="size-7 text-blue-600" />
                      <span className="text-lg text-blue-600 font-regular">
                        Rest Timer: {formatRestTimerLabel(routineExercise.restTimerSeconds)}
                      </span>
                    </div>


                    {/* Sets Table */}
                    {sets.length > 0 ? (
                      <div className="max-w-[300px]">
                        <table className="w-full text-left ml-2">
                          <thead>
                            <tr>
                              <th className="py-2 text-sm font-regular text-gray-600">
                                SET
                              </th>
                              <th className="py-2 text-sm font-regular text-gray-600">
                                KG
                              </th>
                              <th className="py-2 text-sm font-regular text-gray-600">
                                REPS
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sets.map((set, setIndex) => (
                              <tr
                                key={setIndex}
                                className="border-b border-gray-100 last:border-b-0"
                              >
                                <td className="py-2 text-lg font-semibold pl-2">
                                  {set.setNumber || setIndex + 1}
                                </td>
                                <td className="py-2 text-lg">
                                  {set.kg || 0}
                                </td>
                                <td className="py-2 text-lg pl-2">
                                  {formatReps(set)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        No sets configured
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <DetailRoutineOptionModal
        open={showRoutineModal}
        onClose={handleRoutineModalClose}
        routine={selectedRoutine}
        onEdit={handleRoutineEdit}
        onDelete={handleRoutineDelete}
        onDuplicate={handleRoutineDuplicate}
      />
    </div>
  );
}