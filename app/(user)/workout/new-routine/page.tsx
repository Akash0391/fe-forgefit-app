"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, Plus, MoreVertical, Check, SquareCheck, X, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Exercise, SetData, workoutApi } from "@/lib/api";

interface RoutineExercise {
  exercise: Exercise;
  sets: SetData[];
  notes: string;
}

export default function NewRoutinePage() {
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [routineTitle, setRoutineTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load workout data from sessionStorage if available
    const workoutDataStr = sessionStorage.getItem("workoutToRoutine");
    if (workoutDataStr) {
      try {
        const workoutData = JSON.parse(workoutDataStr);
        setRoutineTitle(workoutData.name || "");
        setExercises(workoutData.exercises || []);
        // Clear sessionStorage after loading
        sessionStorage.removeItem("workoutToRoutine");
      } catch (error) {
        console.error("Error loading workout data:", error);
      }
    }
  }, []);

  const handleAddExercise = () => {
    // Navigate to add exercise page
    router.push("/workout/new-routine/add-exercise");
  };

  const handleSave = async () => {
    if (!routineTitle.trim()) {
      setError("Please enter a routine title");
      return;
    }

    if (exercises.length === 0) {
      setError("Please add at least one exercise");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await workoutApi.saveRoutine({
        name: routineTitle.trim(),
        exercises: exercises.map(ex => ({
          exercise: ex.exercise,
          sets: ex.sets || [],
          notes: ex.notes || ""
        })),
        supersetGroups: []
      });

      // Navigate back to workout page after successful save
      router.push("/workout");
    } catch (err: any) {
      console.error("Error saving routine:", err);
      setError(err.message || "Failed to save routine. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotesChange = (index: number, notes: string) => {
    const updatedExercises = [...exercises];
    updatedExercises[index].notes = notes;
    setExercises(updatedExercises);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const updatedExercises = [...exercises];
    const currentSets = updatedExercises[exerciseIndex].sets || [];
    const newSet: SetData = {
      setNumber: currentSets.length + 1,
      previous: "-",
      kg: 0,
      reps: 0,
      completed: false,
    };
    updatedExercises[exerciseIndex].sets = [...currentSets, newSet];
    setExercises(updatedExercises);
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Edit Profile */}
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="text-blue-500 text-lg font-regular">Cancel</button>

          {/* Center: Username */}
          <h1 className="text-lg font-regular">Create Routine</h1>

          {/* Right: Save Button */}
          <Button
            variant="default"
            onClick={handleSave}
            disabled={exercises.length === 0 || isSaving || !routineTitle.trim()}
            className={`text-lg font-regular ${exercises.length === 0 || isSaving || !routineTitle.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="relative flex items-center">
          <Input
            type="text"
            placeholder="Routine title"
            value={routineTitle}
            onChange={(e) => {
              setRoutineTitle(e.target.value);
              setError(null);
            }}
            className="text-xl p-4 pr-12 font-semibold border-none outline-none placeholder:text-gray-400 placeholder:text-xl"
          />
          {routineTitle && (
            <button
              onClick={() => setRoutineTitle("")}
              className="absolute right-4 flex bg-gray-200 p-1 items-center justify-center w-6 h-6 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Clear title"
            >
              <X className="size-6 text-gray-500" />
            </button>
          )}
        </div>
        {error && (
          <div className="mt-2 text-red-500 text-sm px-4">
            {error}
          </div>
        )}
      </div>

      {/* Main Content Area - Get Started or Exercise List */}
      {exercises.length === 0 ? (
        <>
          <div className="flex flex flex-col items-center justify-center px-4 pt-20 pb-2">
            <Dumbbell className="size-[36px] text-gray-300 mb-6 stroke-[1.5]" />
            <p className="text-gray-500 font-regular text-lg text-center">
              Get started by adding an exercise to your routine.
            </p>
          </div>

          {/* Primary Button */}
          <div className="px-4 py-6">
            <Button
              variant="default"
              onClick={handleAddExercise}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg py-6 rounded-[10px]"
            >
              <Plus className="size-[20px] mr-2" />
              Add Exercise
            </Button>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {exercises.map((routineExercise, index) => {
              const exercise = routineExercise.exercise;
              const sets = routineExercise.sets || [];

              return (
                <div
                  key={exercise._id || index}
                  className="p-2 overflow-hidden"
                >
                  {/* Exercise Header */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    {/* Exercise Image/Icon */}
                    <div className="flex items-center gap-4">
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

                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-blue-600 truncate">
                          {formatExerciseName(exercise)}
                        </h3>
                      </div>
                    </div>

                    {/* Options Menu */}
                    <button
                      className="flex-shrink-0 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical className="size-7 text-gray-600" />
                    </button>
                  </div>

                  {/* Notes Section */}
                  <div className="mb-4">
                    <Input
                      placeholder="Add routine note here"
                      value={routineExercise.notes || ""}
                      onChange={(e) => handleNotesChange(index, e.target.value)}
                      className="w-full !border-none text-gray-500 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Rest Timer Section */}
                  <div
                    className="flex items-center gap-2 mb-5 mt-5 cursor-pointer hover:opacity-80 transition-opacity active:opacity-70"
                  >
                    <Timer className="size-7 text-blue-600" />
                    <span className="text-lg text-blue-600 font-regular">
                      Rest Timer: OFF
                    </span>
                  </div>

                  {/* Sets Table */}
                  <div className="mb-4">
                    {/* Table Header */}
                    <div className="grid grid-cols-5 gap-20 mb-2 text-sm font-regular text-gray-500 pb-2">
                      <div className="text-center">SET</div>
                      <div className="text-center">PREVIOUS</div>
                      <div className="flex items-center justify-center gap-1">
                        <Dumbbell className="size-3" />
                        KG
                      </div>
                      <div className="text-center">REPS</div>
                      <div className="flex justify-center">
                        <Check className="size-5 text-blue-600" />
                      </div>
                    </div>

                    {/* Sets Rows */}
                    {sets.length > 0 ? (
                      sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className={`grid grid-cols-5 gap-20 items-center py-2 border-b border-gray-100 last:border-b-0 rounded transition-colors ${set.completed ? "bg-green-100" : ""
                            }`}
                        >
                          <div
                            className={`text-lg font-semibold text-center ${set.completed ? "text-black" : "text-gray-700"
                              }`}
                          >
                            {set.setNumber}
                          </div>
                          <div
                            className={`text-lg font-semibold text-center ${set.completed ? "text-black" : "text-gray-500"
                              }`}
                          >
                            {set.previous}
                          </div>
                          <div className="flex justify-center">
                            <div
                              className={`w-full h-8 px-2 text-lg text-center flex items-center justify-center ${set.completed ? "bg-green-100" : ""
                                }`}
                            >
                              {set.kg || 0}
                            </div>
                          </div>
                          <div className="flex justify-center">
                            <div
                              className={`w-full h-8 px-2 text-lg text-center flex items-center justify-center ${set.completed ? "bg-green-100" : ""
                                }`}
                            >
                              {set.reps || 0}
                            </div>
                          </div>
                          <div className="flex justify-center">
                            {set.completed ? (
                              <SquareCheck className="size-6 text-green-600" />
                            ) : (
                              <SquareCheck className="size-6 text-gray-300" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        No sets added yet
                      </div>
                    )}
                  </div>

                  {/* Add Set Button */}
                  <Button
                    variant="ghost"
                    onClick={() => handleAddSet(index)}
                    className="w-full text-gray-700 bg-gray-100 py-2 h-auto rounded-[10px]"
                  >
                    <Plus className="size-6 mr-2" />
                    <span className="text-lg font-regular">Add Set</span>
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Buttons - Show below exercise cards */}
          <div className="p-2 space-y-5 pb-6">
            {/* Primary Button */}
            <Button
              variant="default"
              onClick={handleAddExercise}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg py-6 rounded-[10px]"
            >
              <Plus className="size-[20px] mr-2" />
              Add Exercise
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
