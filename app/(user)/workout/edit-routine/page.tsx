"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dumbbell,
  Plus,
  MoreVertical,
  X,
  Timer,
  ChevronDown,
  Check,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Exercise, SetData, workoutApi, Workout } from "@/lib/api";
import { RestTimerModal } from "@/components/RestTimerModal";
import ExerciseOptionsModal from "@/components/ExerciseOptionsModal";
import AddToSupersetModal from "@/components/AddToSupersetModal";

interface RoutineExercise {
  exercise: Exercise;
  sets: (SetData & { minReps?: number; maxReps?: number })[];
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

export default function EditRoutinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routineId = searchParams.get("id");

  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [routineTitle, setRoutineTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Superset state
  const [supersetGroups, setSupersetGroups] = useState<Set<string>[]>([]);
  const [selectedExerciseForMenu, setSelectedExerciseForMenu] =
    useState<Exercise | null>(null);
  const [showSupersetModal, setShowSupersetModal] = useState(false);

  const [showRepetitionModal, setShowRepetitionModal] = useState(false);
  const [isRepetitionModalVisible, setIsRepetitionModalVisible] =
    useState(false);
  const [shouldRenderRepetitionModal, setShouldRenderRepetitionModal] =
    useState(false);
  const repetitionModalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [repetitionMode, setRepetitionMode] = useState<"reps" | "range">(
    "reps"
  );
  const [restTimerExerciseIndex, setRestTimerExerciseIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (routineId) {
      loadRoutine();
    } else {
      setError("Routine ID is required");
      setIsLoading(false);
    }
  }, [routineId]);

  useEffect(() => {
    // Check for exercises (and supersets) added from add-exercise page
    const checkForNewExercises = () => {
      const routineDataStr = sessionStorage.getItem("routineExercisesToAdd");
      if (routineDataStr) {
        try {
          const data = JSON.parse(routineDataStr);
          if (data.routineId === routineId) {
            const updatedExercises = data.exercises || [];
            setExercises(updatedExercises);

            // restore superset groups if present
            if (data.supersetGroups) {
              const groups: Set<string>[] = (data.supersetGroups || []).map(
                (g: string[] | { exerciseIds?: string[] }) =>
                  new Set(
                    Array.isArray(g)
                      ? g
                      : (g.exerciseIds as string[] | undefined) || []
                  )
              );
              setSupersetGroups(groups);
            }

            sessionStorage.removeItem("routineExercisesToAdd");
          }
        } catch (error) {
          console.error("Error loading new exercises:", error);
        }
      }
    };

    // Check on mount and when page becomes visible
    checkForNewExercises();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForNewExercises();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.addEventListener("focus", checkForNewExercises);

    const handleExercisesAdded = () => {
      checkForNewExercises();
    };
    window.addEventListener("routineExercisesAdded", handleExercisesAdded);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", checkForNewExercises);
      window.removeEventListener("routineExercisesAdded", handleExercisesAdded);
    };
  }, [routineId]);

  const loadRoutine = async () => {
    if (!routineId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await workoutApi.getRoutines();
      const routine = response.data.find((r: Workout) => r._id === routineId);

      if (!routine) {
        setError("Routine not found");
        setIsLoading(false);
        return;
      }

      setRoutineTitle(routine.name || "");

      const routineExercises: RoutineExercise[] = routine.exercises.map(
        (ex: any) => {
          const exercise =
            typeof ex.exerciseId === "object"
              ? ex.exerciseId
              : { _id: ex.exerciseId };
          return {
            exercise: exercise as Exercise,
            sets: (ex.sets || []).map((set: any) => ({
              ...set,
              minReps: set.minReps,
              maxReps: set.maxReps,
            })),
            notes: ex.notes || "",
            restTimerSeconds: ex.restTimerSeconds ?? 0,
          };
        }
      );

      setExercises(routineExercises);

      // 🔹 load superset groups from routine
      const groups: Set<string>[] = (routine.supersetGroups || []).map(
        (group: any) =>
          new Set(
            Array.isArray(group)
              ? group
              : (group.exerciseIds as string[] | undefined) || []
          )
      );
      setSupersetGroups(groups);
    } catch (err: any) {
      console.error("Error loading routine:", err);
      setError(err.message || "Failed to load routine. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const openRestTimerSheet = (exerciseIndex: number) => {
    setRestTimerExerciseIndex(exerciseIndex);
  };

  const closeRestTimerSheet = () => {
    setRestTimerExerciseIndex(null);
  };

  const handleRestTimerSelect = (seconds: number) => {
    setExercises((prev) => {
      if (restTimerExerciseIndex === null) return prev;
      const updated = [...prev];
      const ex = { ...updated[restTimerExerciseIndex] };
      ex.restTimerSeconds = seconds;
      updated[restTimerExerciseIndex] = ex;
      return updated;
    });
  };

  const handleAddExercise = () => {
    // Store current routine state (including superset groups) before navigating
    sessionStorage.setItem(
      "routineExercisesToAdd",
      JSON.stringify({
        routineId: routineId,
        exercises: exercises,
        supersetGroups: supersetGroups.map((g) => Array.from(g)),
      })
    );
    router.push("/workout/quick-start/add-exercise?mode=routine");
  };

  const handleSave = async () => {
    if (!routineId) {
      setError("Routine ID is missing");
      return;
    }

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
      await workoutApi.updateRoutine({
        routineId: routineId,
        name: routineTitle.trim(),
        exercises: exercises.map((ex) => ({
          exercise: ex.exercise,
          sets: (ex.sets || []).map((set) => ({
            setNumber: set.setNumber,
            previous: set.previous,
            kg: set.kg,
            reps: set.reps,
            completed: set.completed,
            minReps: (set as any).minReps,
            maxReps: (set as any).maxReps,
          })),
          notes: ex.notes || "",
          restTimerSeconds: ex.restTimerSeconds ?? 0,
        })),
        // 🔹 persist superset groups
        supersetGroups: supersetGroups.map((g) => Array.from(g)),
      });

      router.push("/workout");
    } catch (err: any) {
      console.error("Error updating routine:", err);
      setError(err.message || "Failed to update routine. Please try again.");
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

  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: "kg" | "reps" | "minReps" | "maxReps",
    value: number
  ) => {
    const updatedExercises = [...exercises];
    const sets = [...updatedExercises[exerciseIndex].sets];
    sets[setIndex] = { ...sets[setIndex], [field]: value };
    updatedExercises[exerciseIndex].sets = sets;
    setExercises(updatedExercises);
  };

  const handleRemoveExercise = (index: number) => {
    const removedExerciseId = exercises[index].exercise._id;

    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises);

    // 🔹 remove from superset groups
    setSupersetGroups((prev) =>
      prev
        .map((group) => {
          const g = new Set(group);
          g.delete(removedExerciseId);
          return g;
        })
        // keep groups that still have at least 2 exercises
        .filter((g) => g.size > 1)
    );
  };

  // check if an exercise is in any superset group
  const isExerciseInSuperset = (exerciseId: string): boolean => {
    return supersetGroups.some((group) => group.has(exerciseId));
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

  const handleRoutineOptionsClick = (exercise: Exercise) => {
    setSelectedExerciseForMenu(exercise);
  };

  const handleRepetitionModeSelect = (mode: "reps" | "range") => {
    setRepetitionMode(mode);

    if (mode === "range") {
      const updatedExercises = exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => {
          if (!(set as any).minReps && set.reps && set.reps > 0) {
            return {
              ...set,
              minReps: set.reps,
              maxReps: (set as any).maxReps || undefined,
            };
          }
          return set;
        }),
      }));
      setExercises(updatedExercises);
    }
  };

  // Handle repetition modal visibility with transitions
  useEffect(() => {
    if (showRepetitionModal) {
      if (repetitionModalTimeoutRef.current) {
        clearTimeout(repetitionModalTimeoutRef.current);
        repetitionModalTimeoutRef.current = null;
      }
      setShouldRenderRepetitionModal(true);
      setTimeout(() => {
        setIsRepetitionModalVisible(true);
      }, 10);
    } else {
      setIsRepetitionModalVisible(false);
      repetitionModalTimeoutRef.current = setTimeout(() => {
        setShouldRenderRepetitionModal(false);
      }, 300);
    }

    return () => {
      if (repetitionModalTimeoutRef.current) {
        clearTimeout(repetitionModalTimeoutRef.current);
      }
    };
  }, [showRepetitionModal]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-gray-500">Loading routine...</p>
      </div>
    );
  }

  if (error && !routineId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => router.push("/workout")} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="text-blue-500 text-lg font-regular"
          >
            Cancel
          </button>

          <h1 className="text-lg font-regular">Edit Routine</h1>

          <Button
            variant="default"
            onClick={handleSave}
            disabled={
              exercises.length === 0 || isSaving || !routineTitle.trim()
            }
            className={`text-lg font-regular ${
              exercises.length === 0 || isSaving || !routineTitle.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white rounded-[8px] py-6"
            }`}
          >
            {isSaving ? "Updating..." : "Update"}
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
          <div className="mt-2 text-red-500 text-sm px-4">{error}</div>
        )}
      </div>

      {/* Main Content Area */}
      {exercises.length === 0 ? (
        <>
          <div className="flex flex flex-col items-center justify-center px-4 pt-20 pb-2">
            <Dumbbell className="size-[36px] text-gray-300 mb-6 stroke-[1.5]" />
            <p className="text-gray-500 font-regular text-lg text-center">
              Get started by adding an exercise to your routine.
            </p>
          </div>

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
                <div key={exercise._id || index} className="p-2 overflow-hidden">
                  {/* Exercise Header */}
                  <div className="flex items-center justify-between gap-3 mb-4">
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

                      <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-semibold text-blue-600 truncate">
                          {formatExerciseName(exercise)}
                        </h3>

                        {/* Superset badge */}
                        {isExerciseInSuperset(exercise._id) && (
                          <div className="bg-[#b600fd] text-white text-lg font-regular rounded-[8px] text-center py-0.5 px-5 inline-block">
                            Superset
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Options Menu */}
                    <button
                      onClick={() =>
                        handleRoutineOptionsClick(routineExercise.exercise)
                      }
                      className="flex-shrink-0 hover:bg-gray-100 rounded-full transition-colors p-1"
                      aria-label="Exercise options"
                    >
                      <MoreVertical className="size-7 text-gray-600" />
                    </button>
                  </div>

                  {/* Notes */}
                  <div className="mb-4">
                    <Input
                      placeholder="Add routine note here"
                      value={routineExercise.notes || ""}
                      onChange={(e) => handleNotesChange(index, e.target.value)}
                      className="w-full !border-none text-gray-500 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Rest Timer */}
                  <div
                    className="flex items-center gap-2 mb-5 mt-5 cursor-pointer hover:opacity-80 transition-opacity active:opacity-70"
                    onClick={() => openRestTimerSheet(index)}
                  >
                    <Timer className="size-7 text-blue-600" />
                    <span className="text-lg text-blue-600 font-regular">
                      Rest Timer:{" "}
                      {formatRestTimerLabel(routineExercise.restTimerSeconds)}
                    </span>
                  </div>

                  {/* Sets Table */}
                  <div className="mb-4">
                    <div className="grid grid-cols-3 gap-20 mb-2 text-sm font-regular text-gray-500 pb-2">
                      <div className="text-center">SET</div>
                      <div className="flex items-center justify-center gap-1">
                        <Dumbbell className="size-3" />
                        KG
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span>
                          {repetitionMode === "reps" ? "REPS" : "REP RANGE"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowRepetitionModal(true)}
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                          aria-label="Change repetition option"
                        >
                          <ChevronDown className="size-4 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {sets.length > 0 ? (
                      sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className={`grid grid-cols-3 gap-20 items-center py-2 border-b border-gray-100 last:border-b-0 rounded transition-colors ${
                            set.completed ? "bg-green-100" : ""
                          }`}
                        >
                          <div
                            className={`text-lg font-semibold text-center ${
                              set.completed ? "text-black" : "text-gray-700"
                            }`}
                          >
                            {set.setNumber}
                          </div>
                          <div className="flex justify-center">
                            <Input
                              type="number"
                              value={set.kg || ""}
                              onChange={(e) =>
                                handleSetChange(
                                  index,
                                  setIndex,
                                  "kg",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className={`w-full h-8 px-2 text-lg text-center !border-0 border-none focus:!border-0 focus:border-none focus:ring-0 focus:outline-none shadow-none ${
                                set.completed ? "bg-green-100" : ""
                              }`}
                              placeholder="0"
                            />
                          </div>
                          <div className="flex justify-start items-center">
                            {repetitionMode === "reps" ? (
                              <Input
                                type="number"
                                value={set.reps || ""}
                                onChange={(e) =>
                                  handleSetChange(
                                    index,
                                    setIndex,
                                    "reps",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className={`w-full h-8 px-2 text-lg text-center !border-0 border-none focus:!border-0 focus:border-none focus:ring-0 focus:outline-none shadow-none ${
                                  set.completed ? "bg-green-100" : ""
                                }`}
                                placeholder="0"
                              />
                            ) : (
                              <div className="flex items-center gap-1.5 w-full justify-start">
                                <Input
                                  type="number"
                                  value={(set as any).minReps || ""}
                                  onChange={(e) =>
                                    handleSetChange(
                                      index,
                                      setIndex,
                                      "minReps",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className={`w-16 h-8 px-2 text-lg text-center !border-0 border-none focus:!border-0 focus:border-none focus:ring-0 focus:outline-none shadow-none ${
                                    set.completed ? "bg-green-100" : ""
                                  }`}
                                  placeholder="-"
                                />
                                <span className="text-gray-500 text-sm">
                                  to
                                </span>
                                <Input
                                  type="number"
                                  value={(set as any).maxReps || ""}
                                  onChange={(e) =>
                                    handleSetChange(
                                      index,
                                      setIndex,
                                      "maxReps",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className={`w-16 h-8 px-2 text-lg text-center !border-0 border-none focus:!border-0 focus:border-none focus:ring-0 focus:outline-none shadow-none ${
                                    set.completed ? "bg-green-100" : ""
                                  }`}
                                  placeholder="-"
                                />
                              </div>
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

          {/* Bottom Add Exercise */}
          <div className="p-2 space-y-5 pb-6">
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

      {/* Repetition Options Modal */}
      {shouldRenderRepetitionModal && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ease-in-out ${
              isRepetitionModalVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setShowRepetitionModal(false)}
            style={{
              pointerEvents: isRepetitionModalVisible ? "auto" : "none",
            }}
          />
          <div
            className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-100 rounded-t-[30px] shadow-lg transition-all duration-300 ease-in-out min-h-[40vh] ${
              isRepetitionModalVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2">
              <div className="h-1.5 w-17 bg-gray-400 rounded-lg"></div>
            </div>

            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-regular text-center">
                Repetition options
              </h2>
            </div>

            <div className="px-6 py-7 pb-8">
              <div className="bg-white rounded-[10px] overflow-hidden">
                {[
                  { id: "reps", label: "Reps" },
                  { id: "range", label: "Rep range" },
                ].map((option, index) => {
                  const isSelected = repetitionMode === option.id;
                  const isLast = index === 1;
                  return (
                    <button
                      key={option.id}
                      onClick={() =>
                        handleRepetitionModeSelect(
                          option.id as "reps" | "range"
                        )
                      }
                      className={`w-full flex items-center justify-between gap-5 px-6 py-6 transition-colors text-left ${
                        !isLast ? "border-b border-gray-100" : ""
                      } hover:bg-gray-50 active:bg-gray-100`}
                    >
                      <span
                        className={`text-lg font-regular ${
                          isSelected ? "text-blue-600" : "text-gray-900"
                        }`}
                      >
                        {option.label}
                      </span>
                      <div
                        className={`size-7 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "text-blue-600" : "text-gray-400"
                        }`}
                      >
                        {isSelected && <Check className="size-7" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Rest Timer Modal */}
      <RestTimerModal
        open={restTimerExerciseIndex !== null}
        exerciseName={
          restTimerExerciseIndex !== null
            ? formatExerciseName(exercises[restTimerExerciseIndex].exercise)
            : ""
        }
        currentSeconds={
          restTimerExerciseIndex !== null
            ? exercises[restTimerExerciseIndex].restTimerSeconds ?? 35
            : 35
        }
        onSelect={handleRestTimerSelect}
        onClose={closeRestTimerSheet}
      />

      {/* 🔹 Exercise Options Modal (includes Add / Remove Superset) */}
      <ExerciseOptionsModal
        open={selectedExerciseForMenu !== null && !showSupersetModal}
        onClose={() => setSelectedExerciseForMenu(null)}
        exercise={selectedExerciseForMenu}
        isInSuperset={
          selectedExerciseForMenu
            ? isExerciseInSuperset(selectedExerciseForMenu._id)
            : false
        }
        onReorder={() => {
          console.log("Reorder from EditRoutinePage – implement if needed");
          setSelectedExerciseForMenu(null);
        }}
        onReplace={() => {
          console.log("Replace from EditRoutinePage – implement if needed");
          setSelectedExerciseForMenu(null);
        }}
        onAddToSuperset={() => {
          // open Superset modal; keep selected exercise
          setShowSupersetModal(true);
        }}
        onRemoveFromSuperset={() => {
          if (selectedExerciseForMenu) {
            const id = selectedExerciseForMenu._id;
            setSupersetGroups((prev) =>
              prev
                .map((group) => {
                  const g = new Set(group);
                  g.delete(id);
                  return g;
                })
                .filter((g) => g.size > 1)
            );
          }
          setSelectedExerciseForMenu(null);
        }}
        onRemove={() => {
          if (selectedExerciseForMenu) {
            const id = selectedExerciseForMenu._id;
            setExercises((prev) =>
              prev.filter((re) => re.exercise._id !== id)
            );
            setSupersetGroups((prev) =>
              prev
                .map((group) => {
                  const g = new Set(group);
                  g.delete(id);
                  return g;
                })
                .filter((g) => g.size > 1)
            );
          }
          setSelectedExerciseForMenu(null);
        }}
      />

      {/* 🔹 Add To Superset Modal */}
      <AddToSupersetModal
        open={showSupersetModal}
        onClose={() => {
          setShowSupersetModal(false);
          setSelectedExerciseForMenu(null);
        }}
        exercises={exercises.map((re) => re.exercise)}
        currentExercise={selectedExerciseForMenu}
        onConfirm={(selectedExerciseIds) => {
          const newGroup = new Set(selectedExerciseIds);

          setSupersetGroups((prev) => {
            // remove selected ids from existing groups
            const cleaned: Set<string>[] = prev
              .map((group) => {
                const g = new Set(group);
                selectedExerciseIds.forEach((id) => g.delete(id));
                return g;
              })
              .filter((g) => g.size > 1);

            // only add if at least 2 exercises
            if (newGroup.size > 1) {
              cleaned.push(newGroup);
            }

            return cleaned;
          });

          // close both modals
          setShowSupersetModal(false);
          setSelectedExerciseForMenu(null);
        }}
      />
    </div>
  );
}
