"use client";

import { RotateCw, Plus, Notebook, Search, Play, X, ChevronDown, ChevronUp, MoreVertical, ChevronRight, MoreHorizontal, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { workoutApi, Workout, Exercise } from "@/lib/api";
import DiscardWorkoutModal from "@/components/DiscardWorkoutModal";

export default function WorkoutPage() {
  const router = useRouter();
  const [workoutInProgress, setWorkoutInProgress] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [routines, setRoutines] = useState<Workout[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(true);
  const [showRoutines, setShowRoutines] = useState(true);

  useEffect(() => {
    // Check if workout is in progress
    const inProgress = localStorage.getItem("workoutInProgress") === "true";
    setWorkoutInProgress(inProgress);
    
    // Fetch routines
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    try {
      setLoadingRoutines(true);
      const response = await workoutApi.getRoutines();
      setRoutines(response.data || []);
    } catch (error) {
      console.error("Error fetching routines:", error);
    } finally {
      setLoadingRoutines(false);
    }
  };

  const handleRefresh = () => {
    fetchRoutines();
    window.location.reload();
  };

  const handleStartEmptyWorkout = () => {
    // Set workout in progress flag
    localStorage.setItem("workoutInProgress", "true");
    router.push("/workout/quick-start");
  };

  const handleResumeWorkout = () => {
    router.push("/workout/quick-start");
  };

  const handleDiscardClick = () => {
    setShowDiscardDialog(true);
  };

  const handleDiscardConfirm = () => {
    setWorkoutInProgress(false);
  };

  const handleStartRoutine = (routine: Workout) => {
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Pro Badge */}
          <div className="flex items-center">
            <span className="px-2 py-0.2 text-lg rounded-full bg-yellow-500 text-gray-600">
              PRO
            </span>
          </div>

          {/* Middle: Workout Title */}
          <h1 className="text-lg font-semibold capitalize">workout</h1>

          {/* Right: Refresh Icon */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-10 w-10"
              aria-label="Refresh page"
            >
              <RotateCw className="size-[20px]" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6 pb-20 mt-8">
        {/* Quick Start Section */}
        <section>
          <h2 className="text-lg font-semibold mb-5">Quick Start</h2>
          <Button
            onClick={() => {
              handleStartEmptyWorkout();
            }}
            variant="outline"
            className="w-full justify-start text-lg bg-gray-100 rounded-[10px] p-8"
            size="lg"
          >
            <Plus className="size-[26px]" />{" "}
            <span className="font-regular">Start Empty Workout</span>
          </Button>
        </section>

        {/* Routines Section */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">Routines</h2>
            <button
              onClick={() => {
                router.push("/workout/new-routine");
              }}
              className="flex items-center justify-center rounded-[10px] p-2 transition-colors cursor-pointer"
              aria-label="New Routine"
            >
              <FolderPlus className="size-[26px]" />
            </button>
          </div>
          <div className="flex flex-row gap-2">
            <button
              onClick={() => {
                router.push("/workout/new-routine");
              }}
              className="w-1/2 flex flex-col items-center justify-center bg-gray-100 rounded-[10px] p-8 hover:bg-gray-200 transition-colors cursor-pointer active:scale-95"
            >
              <Notebook className="size-[20px] mb-2" />
              <p className="text-lg font-regular">New Routine</p>
            </button>
            <button
              onClick={() => {
                router.push("/workout/explore-routines");
              }}
              className="w-1/2 flex flex-col items-center justify-center bg-gray-100 rounded-[10px] p-8 hover:bg-gray-200 transition-colors cursor-pointer active:scale-95"
            >
              <Search className="size-[20px] mb-2" />
              <p className="text-lg font-regular">Explore routines</p>
            </button>
          </div>
        </section>

        {/* My Routines Section */}
        <section>
          <button
            onClick={() => setShowRoutines(!showRoutines)}
            className="flex items-center gap-2 mb-5 w-full text-left"
          >
            {showRoutines ? (
              <ChevronDown className="size-6 text-gray-400" />
            ) : (
              <ChevronRight className="size-6 text-gray-400" />
            )}
            <h2 className="text-lg text-gray-400 font-semibold">
              My Routines ({routines.length})
            </h2>
          </button>

          {showRoutines && (
            <div className="space-y-4">
              {loadingRoutines ? (
                <div className="text-center py-8 text-gray-500">
                  Loading routines...
                </div>
              ) : routines.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No routines yet. Create your first routine!
                </div>
              ) : (
                routines.map((routine) => {
                  const firstExercise = routine.exercises[0];
                  const exercise = typeof firstExercise?.exerciseId === 'object' 
                    ? firstExercise.exerciseId 
                    : null;
                  
                  return (
                    <div
                      key={routine._id}
                      className="bg-white rounded-[10px] p-4 shadow-sm border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">
                            {routine.name}
                          </h3>
                          {exercise && (
                            <p className="text-lg text-gray-500">
                              {formatExerciseName(exercise)}
                            </p>
                          )}
                        </div>
                        <button
                          className="flex-shrink-0 hover:bg-gray-100 rounded-full transition-colors p-1"
                          aria-label="Routine options"
                        >
                          <MoreHorizontal className="size-7 text-black" />
                        </button>
                      </div>
                      <Button
                        onClick={() => handleStartRoutine(routine)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg rounded-[10px] py-6"
                      >
                        Start Routine
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>

        {/* Workout on Progress */}
        {workoutInProgress && (
          <div className="fixed bottom-20 left-0 right-0 px-4 md:hidden border-t border-gray-200 pt-3">
            <div className="w-full bg-white rounded-[10px] px-4">
              <p className="text-lg font-regular text-muted-foreground text-center">Workout in Progress</p>
              <div className="flex gap-3">
                <Button
                  variant="default"
                  className="flex-1 text-lg bg-white hover:bg-blue-600 text-blue-500 rounded-[10px]"
                  onClick={handleResumeWorkout}
                >
                  <Play className="size-[16px] mr-2" />
                  Resume
                </Button>
                <Button
                  variant="default"
                  className="flex-1 text-lg bg-white text-red-500 hover:bg-gray-200 rounded-[10px]"
                  onClick={handleDiscardClick}
                >
                  <X className="size-[16px] mr-2" />
                  Discard
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discard Workout Modal */}
      <DiscardWorkoutModal
        open={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={handleDiscardConfirm}
        message="Are you sure you want to discard this workout in progress?"
      />
    </div>
  );
}
