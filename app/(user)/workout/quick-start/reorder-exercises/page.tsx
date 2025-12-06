"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Minus, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Exercise, workoutApi, SetData as ApiSetData } from "@/lib/api";

type ActiveWorkoutExercise = {
  exerciseId: Exercise | string;
  sets?: ApiSetData[];
  restTimerSeconds?: number;
  _id?: string;
};

type Mode = "workout" | "routine";

interface RoutineDraftExercise {
  exercise: Exercise;
  sets: ApiSetData[];
  notes: string;
  restTimerSeconds?: number;
}

interface RoutineDraft {
  name: string;
  exercises: RoutineDraftExercise[];
}

export default function ReorderExercisesPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("workout");
  const [exercises, setExercises] = useState<ActiveWorkoutExercise[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // ---------- LOAD DATA ----------
  useEffect(() => {
    const load = async () => {
      // 1) Try routine draft first
      const draftStr = sessionStorage.getItem("newRoutineDraft");
      if (draftStr) {
        try {
          const draft: RoutineDraft = JSON.parse(draftStr);

          const routineExercises: ActiveWorkoutExercise[] =
            (draft.exercises || []).map((ex) => ({
              exerciseId: ex.exercise,          // we keep full Exercise object
              sets: ex.sets || [],
              restTimerSeconds: ex.restTimerSeconds ?? 0,
              _id: ex.exercise._id,
            }));

          setMode("routine");
          setExercises(routineExercises);
          return;
        } catch (err) {
          console.error("Error parsing newRoutineDraft:", err);
        }
      }

      // 2) Fallback: workout active (original behavior)
      try {
        const response = await workoutApi.getActive();
        if (response.data) {
          setMode("workout");
          setExercises(response.data.exercises as ActiveWorkoutExercise[]);
        } else {
          setExercises([]);
        }
      } catch (error) {
        console.error("Error loading workout exercises:", error);
        setExercises([]);
      }
    };

    load();
  }, []);

  // ---------- SAVE DATA ----------
  const saveExercises = async (newExercises: ActiveWorkoutExercise[]) => {
    if (mode === "workout") {
      // ==== original Quick-Start behavior ====
      try {
        const response = await workoutApi.getActive();

        let currentSupersetGroups: string[][] = [];
        let currentDuration = 0;
        let startTime: number | undefined = undefined;

        if (response.data) {
          currentSupersetGroups = response.data.supersetGroups.map((group: any) =>
            group.exerciseIds.map((id: string | Exercise) =>
              typeof id === "object" && id !== null && "_id" in id
                ? (id as any)._id
                : (id as string)
            )
          );
          currentDuration = response.data.duration || 0;
          if (response.data.startTime) {
            startTime = new Date(response.data.startTime).getTime();
          }
        }

        const exercisesForSave = newExercises.map((ex) => {
          const base =
            typeof ex.exerciseId === "object"
              ? (ex.exerciseId as Exercise)
              : ({ _id: ex.exerciseId } as Exercise);

          return {
            ...base,
            sets: ex.sets || [],
            restTimerSeconds: ex.restTimerSeconds ?? 0,
          };
        });

        await workoutApi.save({
          exercises: exercisesForSave,
          supersetGroups: currentSupersetGroups,
          duration: currentDuration,
          startTime,
        });

        window.dispatchEvent(new Event("workoutExercisesUpdated"));
      } catch (error) {
        console.error("Error saving workout exercises:", error);
      }
      return;
    }

    // ==== ROUTINE MODE ====
    try {
      const draftStr = sessionStorage.getItem("newRoutineDraft");
      if (!draftStr) return;

      const draft: RoutineDraft = JSON.parse(draftStr);

      const updatedExercises: RoutineDraftExercise[] = newExercises.map(
        (ex) => {
          const exObj =
            typeof ex.exerciseId === "object"
              ? (ex.exerciseId as Exercise)
              : null;

          const id = exObj?._id ?? (ex.exerciseId as string);

          const original =
            draft.exercises?.find(
              (r) => r.exercise._id === id
            ) || null;

          // Keep notes from original, just update order / sets / restTimerSeconds
          if (original) {
            return {
              ...original,
              sets: ex.sets || original.sets || [],
              restTimerSeconds: ex.restTimerSeconds ?? original.restTimerSeconds,
            };
          }

          // Fallback (should rarely happen)
          return {
            exercise: exObj as Exercise,
            sets: ex.sets || [],
            notes: "",
            restTimerSeconds: ex.restTimerSeconds ?? 0,
          };
        }
      );

      const updatedDraft: RoutineDraft = {
        ...draft,
        exercises: updatedExercises,
      };

      sessionStorage.setItem(
        "newRoutineDraft",
        JSON.stringify(updatedDraft)
      );
    } catch (error) {
      console.error("Error saving reordered routine exercises:", error);
    }
  };

  // ---------- DRAG HANDLERS ----------
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

    newExercises.splice(draggedIndex, 1);
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

  const handleDone = () => {
    saveExercises(exercises);
    router.back();
  };

  // ---------- HELPERS ----------
  const getBaseExercise = (ex: ActiveWorkoutExercise): Exercise | null => {
    return typeof ex.exerciseId === "object"
      ? (ex.exerciseId as Exercise)
      : null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-center h-16 px-4">
          <h1 className="text-lg font-regular text-center">Reorder</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-1 pb-6">
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12">
            <Dumbbell className="size-[36px] text-gray-300 mb-6 stroke-[1.5]" />
            <h2 className="text-xl font-bold mb-2">No exercises</h2>
            <p className="text-muted-foreground text-sm text-center">
              {mode === "routine"
                ? "Add exercises to your routine first"
                : "Add exercises to your workout first"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map((item, index) => {
              const base = getBaseExercise(item);
              const key = base?._id || item._id || index.toString();

              let displayName = base?.name || "Exercise";
              if (
                base?.equipment &&
                base.equipment !== "bodyweight" &&
                base.equipment !== "other"
              ) {
                const equipmentFormatted =
                  base.equipment.charAt(0).toUpperCase() +
                  base.equipment.slice(1);
                if (
                  !displayName
                    .toLowerCase()
                    .includes(base.equipment.toLowerCase())
                ) {
                  displayName = `${displayName} (${equipmentFormatted})`;
                }
              }

              const thumbnailUrl = base?.thumbnailUrl;

              return (
                <div
                  key={key}
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
                      draggedIndex !== index
                        ? "cursor-move hover:bg-gray-50"
                        : ""
                    }
                  `}
                >
                  {/* Remove Button (non-functional here, just UI) */}
                  <div className="flex-shrink-0 relative">
                    <Circle className="size-7 fill-red-500 text-red-500" />
                    <Minus className="size-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white stroke-[3]" />
                  </div>

                  {/* Exercise Icon */}
                  <div className="relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Dumbbell className="size-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-regular text-black truncate">
                      {displayName}
                    </h3>
                  </div>

                  {/* Drag handle */}
                  <div className="flex-shrink-0 text-gray-400 flex flex-col gap-1.5">
                    <div className="w-7 h-0.5 bg-gray-400"></div>
                    <div className="w-7 h-0.5 bg-gray-400"></div>
                    <div className="w-7 h-0.5 bg-gray-400"></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Done Button */}
      <div className="sticky bottom-0 bg-background px-4 py-4">
        <Button
          variant="default"
          onClick={handleDone}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg font-regular py-8 rounded-[10px]"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
