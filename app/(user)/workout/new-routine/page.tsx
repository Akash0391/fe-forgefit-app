"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, Plus, MoreVertical, Check, SquareCheck, X, Timer } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Exercise, SetData, workoutApi } from "@/lib/api";
import { RestTimerModal } from "@/components/RestTimerModal";
import ExerciseOptionsModal from "@/components/ExerciseOptionsModal";
import AddToSupersetModal from "@/components/AddToSupersetModal";

interface RoutineExercise {
  exercise: Exercise;
  sets: SetData[];
  notes: string;

  restTimerSeconds?: number; // ✅ NEW
}

interface ExerciseSets {
  [exerciseId: string]: SetData[];
}

const formatRestTimerLabel = (seconds: number): string => {
  if (seconds === 0) return "OFF";
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;

  if (remain === 0) return `${minutes}m`;
  return `${minutes}m ${remain}s`;
};


export default function NewRoutinePage() {
  const searchParams = useSearchParams();
  const initialFolderId = searchParams.get("folderId"); // from URL first time

  const [routineFolderId, setRoutineFolderId] = useState<string | null>(initialFolderId);
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [routineTitle, setRoutineTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restTimerExerciseIndex, setRestTimerExerciseIndex] = useState<number | null>(null);
  const [selectedExerciseForMenu, setSelectedExerciseForMenu] =
    useState<Exercise | null>(null);

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [duration, setDuration] = useState(0); // Duration in seconds
  const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>([]);
  const [showDurationInHeader, setShowDurationInHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showFinishConfirmationModal, setShowFinishConfirmationModal] =
    useState(false);
  const [finishModalMessage, setFinishModalMessage] =
    useState("Add an exercise");
  const [exerciseSets, setExerciseSets] = useState<ExerciseSets>({});
  // Superset groups for the routine (array of exerciseId arrays)
  const [supersetGroups, setSupersetGroups] = useState<string[][]>([]);

  // Control AddToSupersetModal for routines
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [supersetCurrentExercise, setSupersetCurrentExercise] =
    useState<Exercise | null>(null);
  const [removingExerciseIds, setRemovingExerciseIds] = useState<Set<string>>(new Set());


  const router = useRouter();

  // helper: is an exercise already in a superset group?
  const isExerciseInSuperset = (exerciseId: string): boolean => {
    return supersetGroups.some((group) => group.includes(exerciseId));
  };
  useEffect(() => {
    // 1) If there's an in-progress routine draft, use that
    const draftStr = sessionStorage.getItem("newRoutineDraft");
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        setRoutineTitle(draft.name || "");
        setExercises(
          (draft.exercises || []).map((ex: RoutineExercise) => ({
            ...ex,
            restTimerSeconds: ex.restTimerSeconds ?? 35,
          }))
        );

        setRoutineFolderId(draft.routineFolderId ?? initialFolderId ?? null);
      } catch (error) {
        console.error("Error loading routine draft:", error);
      } finally {
        // Clear so we don't reuse it forever
        sessionStorage.removeItem("newRoutineDraft");
      }
      return; // ⬅️ don't also load workoutToRoutine in this case
    }

    // 2) Fallback: original workoutToRoutine logic
    const workoutDataStr = sessionStorage.getItem("workoutToRoutine");
    if (workoutDataStr) {
      try {
        const workoutData = JSON.parse(workoutDataStr);
        setRoutineTitle(workoutData.name || "");
        setExercises(
          (workoutData.exercises || []).map((ex: RoutineExercise) => ({
            ...ex,
            restTimerSeconds: ex.restTimerSeconds ?? 35,
          }))
        );

        setSupersetGroups(workoutData.supersetGroups || []);

        sessionStorage.removeItem("workoutToRoutine");
      } catch (error) {
        console.error("Error loading workout data:", error);
      }
    }
  }, []);


  const openRestTimerSheet = (exerciseIndex: number) => {
    setRestTimerExerciseIndex(exerciseIndex);
  };

  const closeRestTimerSheet = () => {
    setRestTimerExerciseIndex(null);
  };

  const handleRestTimerSelect = (seconds: number) => {
    setExercises(prev => {
      if (restTimerExerciseIndex === null) return prev;
      const updated = [...prev];
      const ex = { ...updated[restTimerExerciseIndex] };
      ex.restTimerSeconds = seconds;
      updated[restTimerExerciseIndex] = ex;
      return updated;
    });
  };


  const handleSetFieldChange = (
    exerciseIndex: number,
    setIndex: number,
    field: "kg" | "reps",
    value: number
  ) => {
    setExercises(prev => {
      const updated = [...prev];
      const exercise = { ...updated[exerciseIndex] };
      const sets = [...(exercise.sets || [])];

      const currentSet = { ...sets[setIndex] };
      currentSet[field] = isNaN(value) ? 0 : value;

      sets[setIndex] = currentSet;
      exercise.sets = sets;
      updated[exerciseIndex] = exercise;

      return updated;
    });
  };

  const saveRoutineDraft = () => {
    const draft = {
      name: routineTitle,
      exercises,          // RoutineExercise[]
      routineFolderId,
    };

    sessionStorage.setItem("newRoutineDraft", JSON.stringify(draft));
  };

  const handleAddExercise = () => {
    // Save current routine draft so AddExercisePage can extend it
    saveRoutineDraft();

    if (routineFolderId) {
      router.push(`/workout/new-routine/add-exercise?folderId=${routineFolderId}`);
    } else {
      router.push("/workout/new-routine/add-exercise");
    }
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
      // string | null
      await workoutApi.saveRoutine({
        name: routineTitle.trim(),
        exercises: exercises.map(ex => ({
          exercise: ex.exercise,
          sets: ex.sets || [],
          notes: ex.notes || "",
          restTimerSeconds: ex.restTimerSeconds ?? 0,
        })),
        supersetGroups,
        routineFolderId: routineFolderId ?? null,
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

  const handleReorderExercises = () => {
    const draft = {
      name: routineTitle,
      exercises, // RoutineExercise[]
    };

    sessionStorage.setItem("newRoutineDraft", JSON.stringify(draft));
    router.push("/workout/quick-start/reorder-exercises");
  };


  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Edit Profile */}
          <button
            onClick={() => router.push("/workout")}
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
                      onClick={() => setSelectedExerciseForMenu(exercise)}
                      className="flex-shrink-0 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical className="size-7 text-gray-600" />
                    </button>
                  </div>

                  {/* Superset badge (same style as QuickStart) */}
                  {isExerciseInSuperset(exercise._id) && (
                    <div className="bg-[#b600fd] text-white text-lg font-regular rounded-[8px] text-center py-0.5 px-5 inline-block mb-3">
                      Superset
                    </div>
                  )}

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
                    onClick={() => openRestTimerSheet(index)}
                  >
                    <Timer className="size-7 text-blue-600" />
                    <span className="text-lg text-blue-600 font-regular">
                      Rest Timer: {formatRestTimerLabel(routineExercise.restTimerSeconds ?? 35)}
                    </span>
                  </div>


                  {/* Sets Table */}
                  <div className="mb-4">
                    {/* Table Header */}
                    <div className="grid grid-cols-5 gap-20 mb-2 text-sm font-regular text-gray-500 pb-2">
                      <div className="text-center">SET</div>
                      <div className="flex items-center justify-center gap-1">
                        <Dumbbell className="size-3" />
                        KG
                      </div>
                      <div className="text-center">REPS</div>
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
                          <div className="flex justify-center">
                            <Input
                              type="number"
                              value={set.kg ?? 0}
                              onChange={(e) =>
                                handleSetFieldChange(
                                  index,
                                  setIndex,
                                  "kg",
                                  Number(e.target.value)
                                )
                              }
                              className={`w-full border-none h-8 px-2 text-lg text-center ${set.completed ? "bg-green-100" : ""}`}
                            />
                          </div>

                          <div className="flex justify-center">
                            <Input
                              type="number"
                              value={set.reps ?? 0}
                              onChange={(e) =>
                                handleSetFieldChange(
                                  index,
                                  setIndex,
                                  "reps",
                                  Number(e.target.value)
                                )
                              }
                              className={`w-full border-none h-8 px-2 text-lg text-center ${set.completed ? "bg-green-100" : ""}`}
                            />
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
          setSelectedExerciseForMenu(null);
          handleReorderExercises();
        }}
        onReplace={() => {
          if (selectedExerciseForMenu) {
            const exerciseId = selectedExerciseForMenu._id;

            // Find which index this exercise is in your routine list
            const index = exercises.findIndex(
              (re) => re.exercise._id === exerciseId
            );
            if (index === -1) {
              console.warn("Could not find exercise index for replace");
              setSelectedExerciseForMenu(null);
              return;
            }

            // 1) Save the full routine as a draft so AddExercisePage can edit it
            saveRoutineDraft();

            // 2) Store the exercise ID (optional, but you already use it elsewhere)
            sessionStorage.setItem("replaceExerciseId", exerciseId);

            // 3) Close the options modal
            setSelectedExerciseForMenu(null);

            // 4) Go to the NEW ROUTINE add-exercise page with mode + index
            const basePath = "/workout/new-routine/add-exercise";
            const folderParam = routineFolderId ? `&folderId=${routineFolderId}` : "";
            router.push(
              `${basePath}?mode=replace&index=${index}${folderParam}`
            );
          }
        }}

        // ➕ Add To Superset → open AddToSupersetModal
        onAddToSuperset={() => {
          if (!selectedExerciseForMenu) return;
          setSupersetCurrentExercise(selectedExerciseForMenu);
          setShowSupersetModal(true);          // this hides the options sheet
        }}

        // ❌ Remove From Superset
        onRemoveFromSuperset={() => {
          if (!selectedExerciseForMenu) return;
          const exerciseId = selectedExerciseForMenu._id;

          setSupersetGroups((prev) =>
            prev
              .map((group) => group.filter((x) => x !== exerciseId)) // remove id from groups
              .filter((group) => group.length > 1)           // keep only 2+ sized groups
          );

          setSelectedExerciseForMenu(null);
        }}
        onRemove={() => {
          if (selectedExerciseForMenu) {
            const exerciseId = selectedExerciseForMenu._id;

            // Start removal animation
            setRemovingExerciseIds((prev) => new Set(prev).add(exerciseId));

            // After animation completes, remove the exercise
            setTimeout(() => {
              setWorkoutExercises((prev) =>
                prev.filter((ex) => ex._id !== exerciseId)
              );
              setExerciseSets((prev) => {
                const newSets = { ...prev };
                delete newSets[exerciseId];
                return newSets;
              });
              // Remove from superset groups if present
              setSupersetGroups((prev) =>
                prev
                  .map((group) => group.filter((x) => x !== exerciseId))
                  .filter((group) => group.length > 1)
              );
              // Clean up removing state
              setRemovingExerciseIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(exerciseId);
                return newSet;
              });
            }, 400); // Animation duration
          }
          setSelectedExerciseForMenu(null);
        }}
      />

      <AddToSupersetModal
        open={showSupersetModal}
        onClose={() => {
          setShowSupersetModal(false);
          setSupersetCurrentExercise(null);
        }}
        // we pass only the Exercise objects to the modal
        exercises={exercises.map((re) => re.exercise)}   // RoutineExercise[] → Exercise[]
        currentExercise={supersetCurrentExercise}
        onConfirm={(selectedExerciseIds) => {
          // selectedExerciseIds already includes the base exercise id

          setSupersetGroups((prev) => {
            // remove any old groups that contain any of these ids
            const toGroup = new Set(selectedExerciseIds);

            const remaining = prev.filter(
              (group) => !group.some((id) => toGroup.has(id))
            );

            // only keep as a superset if 2+ exercises
            if (selectedExerciseIds.length > 1) {
              remaining.push(selectedExerciseIds);
            }

            return remaining;
          });

          setShowSupersetModal(false);
          setSupersetCurrentExercise(null);
        }}
      />


    </div>
  );
}
