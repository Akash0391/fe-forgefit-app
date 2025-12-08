"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronRight, ImagePlus, Plus } from "lucide-react";
import { workoutApi, Workout, SetData, Exercise } from "@/lib/api";
import MediaSelectionModal from "@/components/MediaSelectionModal";
import VisibilityModal from "@/components/VisibilityModal";
import DiscardWorkoutModal from "@/components/DiscardWorkoutModal";
import { WorkoutExerciseCard } from "../page";
import { RestTimerModal } from "@/components/RestTimerModal";
import ExerciseOptionsModal from "@/components/ExerciseOptionsModal";
import AddToSupersetModal from "@/components/AddToSupersetModal";

export default function FinishWorkoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"Everyone" | "Private">(
    "Everyone"
  );
  const [showHeartRate, setShowHeartRate] = useState(true);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // superset + menu + remove animation (mirror of QuickStart)
  const [supersetGroups, setSupersetGroups] = useState<Set<string>[]>([]);
  const [selectedExerciseForMenu, setSelectedExerciseForMenu] =
    useState<{
      exerciseId: string;
      exerciseDoc: Exercise | null;
    } | null>(null);
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [removingExerciseIds, setRemovingExerciseIds] =
    useState<Set<string>>(new Set());

  // rest timer edit per exercise
  const [restTimerModalExercise, setRestTimerModalExercise] =
    useState<{
      exerciseId: string;
      exerciseName: string;
    } | null>(null);
  const [restTimerModalSeconds, setRestTimerModalSeconds] = useState(0);

  useEffect(() => {
    if (isEditMode) {
      // editing an existing workout – load from sessionStorage
      const stored = sessionStorage.getItem("workoutToEdit");
      if (stored) {
        const loadedWorkout: Workout = JSON.parse(stored);

        setWorkout(loadedWorkout);
        setWorkoutTitle(loadedWorkout.name || "");
        setDescription(loadedWorkout.description || "");
        setVisibility(loadedWorkout.visibility || "Everyone");

        // ✅ init supersetGroups from stored workout
        const groups: Set<string>[] = (loadedWorkout.supersetGroups || []).map(
          (group: any) =>
            new Set(
              Array.isArray(group) ? group : group.exerciseIds || []
            )
        );
        setSupersetGroups(groups);

        setLoading(false);
        return;
      }
    }

    // normal "Save Workout" flow
    loadWorkout();
  }, [isEditMode]);

  const loadWorkout = async () => {
    try {
      // First try to get the most recent completed workout from history
      const historyResponse = await workoutApi.getHistory();
      if (historyResponse.data && historyResponse.data.length > 0) {
        const latestWorkout = historyResponse.data[0];
        // Check if this workout was completed very recently (within last minute)
        const endTime = latestWorkout.endTime
          ? new Date(latestWorkout.endTime).getTime()
          : 0;
        const now = Date.now();
        if (endTime > 0 && now - endTime < 60000) {
          // This is likely the workout we just finished
          const loadedWorkout: Workout = latestWorkout;

          setWorkout(loadedWorkout);
          setWorkoutTitle(loadedWorkout.name || "");
          setDescription(loadedWorkout.description || "");
          setVisibility(loadedWorkout.visibility || "Everyone");

          // ✅ init supersetGroups for latest workout
          const groups: Set<string>[] = (
            loadedWorkout.supersetGroups || []
          ).map((group: any) =>
            new Set(
              Array.isArray(group) ? group : group.exerciseIds || []
            )
          );
          setSupersetGroups(groups);

          setLoading(false);
          return;
        }
      }

      // Fallback: Try to get active workout (in case finish hasn't completed yet)
      const activeResponse = await workoutApi.getActive();
      if (activeResponse.data) {
        const loadedWorkout: Workout = activeResponse.data;

        setWorkout(loadedWorkout);
        setWorkoutTitle(loadedWorkout.name || "");
        setDescription(loadedWorkout.description || "");
        setVisibility(loadedWorkout.visibility || "Everyone");

        // ✅ init supersetGroups from active workout
        const groups: Set<string>[] = (
          loadedWorkout.supersetGroups || []
        ).map((group: any) =>
          new Set(
            Array.isArray(group) ? group : group.exerciseIds || []
          )
        );
        setSupersetGroups(groups);
      } else if (historyResponse.data && historyResponse.data.length > 0) {
        // Use the most recent workout even if it's older
        const loadedWorkout: Workout = historyResponse.data[0];

        setWorkout(loadedWorkout);
        setWorkoutTitle(loadedWorkout.name || "");
        setDescription(loadedWorkout.description || "");
        setVisibility(loadedWorkout.visibility || "Everyone");

        // ✅ init supersetGroups from history workout
        const groups: Set<string>[] = (
          loadedWorkout.supersetGroups || []
        ).map((group: any) =>
          new Set(
            Array.isArray(group) ? group : group.exerciseIds || []
          )
        );
        setSupersetGroups(groups);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading workout:", error);
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

  const calculateTotalVolume = (): number => {
    if (!workout) return 0;
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

  const calculateTotalSets = (): number => {
    if (!workout) return 0;
    let totalSets = 0;
    workout.exercises.forEach((exercise) => {
      totalSets += exercise.sets.length;
    });
    return totalSets;
  };

  const formatDateTime = (): string => {
    if (!workout) return "";
    const date = workout.endTime
      ? new Date(workout.endTime)
      : workout.startTime
        ? new Date(workout.startTime)
        : new Date();
    const day = date.getDate();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${day} ${month} ${year}, ${hours}:${minutesStr} ${ampm}`;
  };

  const handleBack = () => {
    if (isEditMode) {
      router.push("/home");
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    if (!workout) return;

    try {
      await workoutApi.updateDetails(workout._id, {
        name: workoutTitle || workout.name,
        description,
        visibility,
        exercises: workout.exercises,
        supersetGroups: supersetGroups.map((g) => Array.from(g)), // 🔹 send to backend
      });

      if (isEditMode) {
        sessionStorage.removeItem("workoutToEdit");
        router.push("/home");
      } else {
        localStorage.removeItem("workoutInProgress");
        router.push("/workout/quick-start/finish-workout/success");
      }
    } catch (err) {
      console.error("Error saving workout details:", err);
    }
  };

  const handleDiscard = () => {
    setShowDiscardDialog(true);
  };

  const handleDiscardConfirm = () => {
    if (isEditMode) {
      router.push("/home");
    } else {
      router.push("/workout");
    }
  };

  const handleTakePhoto = () => {
    console.log("Take photo clicked");
  };

  const handleSelectFromLibrary = () => {
    console.log("Select from library clicked");
  };

  const handleAddExercise = () => {
    if (!workout) return;

    // make sure the latest state is in sessionStorage
    sessionStorage.setItem("workoutToEdit", JSON.stringify(workout));

    // go to Add Exercise in a special mode
    router.push("/workout/quick-start/add-exercise?from=edit");
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No workout data found</p>
      </div>
    );
  }

  const totalVolume = calculateTotalVolume();
  const totalSets = calculateTotalSets();
  const duration = workout.duration || 0;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-10 w-10"
            aria-label="Go back"
          >
            <ArrowLeft className="size-[24px]" />
          </Button>

          {/* Center: Title */}
          <h1 className="text-lg font-regular">
            {isEditMode ? "Edit Workout" : "Save Workout"}
          </h1>

          {/* Right: Save Button */}
          <Button
            variant="default"
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-lg font-regular text-white px-3 rounded-[6px] py-2 h-10"
          >
            Save
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-7 space-y-8">
        {/* Workout Title */}
        <Input
          type="text"
          placeholder="Workout title"
          value={workoutTitle}
          onChange={(e) => setWorkoutTitle(e.target.value)}
          className="text-xl font-bold border-none bg-transparent mb-12 p-1 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Duration</p>
            <p className="text-xl font-regular text-blue-500">
              {formatDuration(duration)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Volume</p>
            <p className="text-xl font-regular">{totalVolume} kg</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Sets</p>
            <p className="text-xl font-regular">{totalSets}</p>
          </div>
        </div>

        {/* When */}
        <div>
          <p className="text-sm text-gray-500 mb-1">When</p>
          <p className="text-lg text-blue-500">{formatDateTime()}</p>
        </div>

        {/* Add Photo/Video */}
        <button
          onClick={() => setShowMediaModal(true)}
          className="flex flex-row items-center gap-5 w-full text-left"
        >
          <div className="border-2 border-dashed border-gray-200 rounded-[10px] p-10 flex items-center justify-center min-w-[100px] min-h-[100px]">
            <ImagePlus className="size-8 text-black" />
          </div>
          <p className="text-black text-lg font-regular">
            Add a photo / video
          </p>
        </button>

        {/* Description */}
        <div>
          <label className="text-sm text-gray-500 mb-2 block">
            Description
          </label>
          <Input
            placeholder="How did your workout go? Leave some notes here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-1 text-lg border-none bg-transparent rounded-lg font-regular text-black placeholder:text-gray-400 resize-none"
          />
        </div>

        {/* Visibility */}
        <div className="flex itemscenter justify-between">
          <label className="text-lg font-regular text-black">
            Visibility
          </label>
          <button
            onClick={() => setShowVisibilityModal(true)}
            className="flex items-center gap-2 text-lg font-regular text-gray-500"
          >
            <span>{visibility}</span>
            <ChevronRight className="size-6 text-gray-400" />
          </button>
        </div>

        {/* Exercises – mirror of quick-start cards */}
        {isEditMode && (
          <>
            <div>
              <div className="space-y-4">
                {workout.exercises.map((we, index) => {
                  const baseExercise: Exercise =
                    typeof we.exerciseId === "object"
                      ? (we.exerciseId as Exercise)
                      : ({ _id: we.exerciseId, name: "Exercise" } as Exercise);

                  const exerciseId =
                    typeof we.exerciseId === "object"
                      ? (we.exerciseId as any)._id
                      : (we.exerciseId as string);

                  const sets = (we.sets || []) as SetData[];
                  const restTimerSeconds = we.restTimerSeconds ?? 0;

                  const isInSuperset = supersetGroups.some((g) =>
                    g.has(exerciseId)
                  );
                  const isRemoving = removingExerciseIds.has(exerciseId);
                  const hasRemovingBefore = workout.exercises
                    .slice(0, index)
                    .some((ex) => {
                      const id =
                        typeof ex.exerciseId === "object"
                          ? (ex.exerciseId as any)._id
                          : (ex.exerciseId as string);
                      return removingExerciseIds.has(id);
                    });

                  const defaultSet: SetData[] = [
                    {
                      setNumber: 1,
                      previous: "-",
                      kg: 0,
                      reps: 0,
                      completed: false,
                    },
                  ];

                  return (
                    <WorkoutExerciseCard
                      key={exerciseId}
                      exercise={baseExercise}
                      sets={sets.length ? sets : defaultSet}
                      onSetsChange={(newSets) => {
                        setWorkout((prev) => {
                          if (!prev) return prev;
                          const updated = { ...prev };
                          updated.exercises = [...updated.exercises];
                          updated.exercises[index] = {
                            ...updated.exercises[index],
                            sets: newSets,
                          };
                          return updated;
                        });
                      }}
                      onMenuClick={() =>
                        setSelectedExerciseForMenu({
                          exerciseId,
                          exerciseDoc: baseExercise,
                        })
                      }
                      isInSuperset={isInSuperset}
                      isRemoving={isRemoving}
                      shouldSlideUp={hasRemovingBefore}
                      restTimerSeconds={restTimerSeconds}
                      onRestTimerClick={() => {
                        setRestTimerModalExercise({
                          exerciseId,
                          exerciseName: baseExercise.name,
                        });
                        setRestTimerModalSeconds(restTimerSeconds);
                      }}
                      onSetCompleted={undefined} // no live rest countdown on edit page
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <Button
                variant="default"
                onClick={handleAddExercise}
                className="w-full bg-blue-500 px-2 hover:bg-blue-600 text-white text-lg py-6 rounded-[10px]"
              >
                <Plus className="size-[20px] mr-2" />
                Add Exercise
              </Button>
            </div>
          </>
        )}
        {/* Discard / Add Exercise */}
        <div className="pb-6 text-center">
          <button
            onClick={handleDiscard}
            className="mt-4 text-red-500 text-lg font-regular"
          >
            Discard Workout
          </button>
        </div>
      </div>

      {/* Media Selection Modal */}
      <MediaSelectionModal
        open={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onTakePhoto={handleTakePhoto}
        onSelectFromLibrary={handleSelectFromLibrary}
      />

      {/* Visibility Modal */}
      <VisibilityModal
        open={showVisibilityModal}
        onClose={() => setShowVisibilityModal(false)}
        visibility={visibility}
        onVisibilityChange={setVisibility}
        showHeartRate={showHeartRate}
        onShowHeartRateChange={setShowHeartRate}
      />

      {/* Discard Workout Modal */}
      <DiscardWorkoutModal
        open={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={handleDiscardConfirm}
      />

      {restTimerModalExercise && (
        <RestTimerModal
          open={true}
          exerciseName={restTimerModalExercise.exerciseName}
          currentSeconds={restTimerModalSeconds}
          onSelect={(seconds) => {
            setRestTimerModalSeconds(seconds);

            // update restTimerSeconds on workout.exercises
            setWorkout((prev) => {
              if (!prev) return prev;
              const updated = { ...prev };
              updated.exercises = updated.exercises.map((we) => {
                const id =
                  typeof we.exerciseId === "object"
                    ? (we.exerciseId as any)._id
                    : (we.exerciseId as string);

                if (id !== restTimerModalExercise.exerciseId) return we;
                return { ...we, restTimerSeconds: seconds };
              });
              return updated;
            });
          }}
          onClose={() => setRestTimerModalExercise(null)}
        />
      )}

      {/* Exercise Options Modal – mirror QuickStart */}
      <ExerciseOptionsModal
        open={selectedExerciseForMenu !== null && !showSupersetModal}
        onClose={() => setSelectedExerciseForMenu(null)}
        exercise={selectedExerciseForMenu?.exerciseDoc || null}
        isInSuperset={
          selectedExerciseForMenu
            ? supersetGroups.some((g) =>
              g.has(selectedExerciseForMenu.exerciseId)
            )
            : false
        }
        onReorder={() => {
          setSelectedExerciseForMenu(null);

          if (isEditMode && workout) {
            // keep latest workout in sessionStorage
            sessionStorage.setItem("workoutToEdit", JSON.stringify(workout));

            // go to reorder in edit mode
            router.push("/workout/quick-start/reorder-exercises?from=edit");
          } else {
            // normal quick-start flow
            router.push("/workout/quick-start/reorder-exercises");
          }
        }}

        onReplace={() => {
          if (!selectedExerciseForMenu) return;

          const id = selectedExerciseForMenu.exerciseId;

          // store which exercise we want to replace
          sessionStorage.setItem("replaceExerciseId", id);

          // if we’re editing a historic workout, also store the latest snapshot
          if (isEditMode && workout) {
            sessionStorage.setItem("workoutToEdit", JSON.stringify(workout));
            router.push(
              "/workout/quick-start/add-exercise?mode=replace&from=edit"
            );
          } else {
            // normal quick-start / routine flow
            router.push("/workout/quick-start/add-exercise?mode=replace");
          }

          setSelectedExerciseForMenu(null);
        }}

        onAddToSuperset={() => {
          setShowSupersetModal(true);
        }}
        onRemoveFromSuperset={() => {
          if (selectedExerciseForMenu) {
            setSupersetGroups((prev) =>
              prev.filter((g) => !g.has(selectedExerciseForMenu.exerciseId))
            );
          }
          setSelectedExerciseForMenu(null);
        }}
        onRemove={() => {
          if (selectedExerciseForMenu) {
            const id = selectedExerciseForMenu.exerciseId;

            // start removal animation
            setRemovingExerciseIds((prev) => new Set(prev).add(id));

            setTimeout(() => {
              // remove from workout.exercises
              setWorkout((prev) => {
                if (!prev) return prev;
                const updated = { ...prev };
                updated.exercises = updated.exercises.filter((we) => {
                  const weId =
                    typeof we.exerciseId === "object"
                      ? (we.exerciseId as any)._id
                      : (we.exerciseId as string);
                  return weId !== id;
                });
                return updated;
              });

              // remove from supersetGroups
              setSupersetGroups((prev) =>
                prev
                  .map((g) => {
                    const ng = new Set(g);
                    ng.delete(id);
                    return ng;
                  })
                  .filter((g) => g.size > 0)
              );

              // clear removing flag
              setRemovingExerciseIds((prev) => {
                const ns = new Set(prev);
                ns.delete(id);
                return ns;
              });
            }, 400);
          }
          setSelectedExerciseForMenu(null);
        }}
      />

      {/* Add To Superset Modal – mirror QuickStart */}
      <AddToSupersetModal
        open={showSupersetModal}
        onClose={() => {
          setShowSupersetModal(false);
          setSelectedExerciseForMenu(null);
        }}
        exercises={workout.exercises.map((we) =>
          typeof we.exerciseId === "object"
            ? (we.exerciseId as Exercise)
            : ({ _id: we.exerciseId, name: "Exercise" } as Exercise)
        )}
        currentExercise={selectedExerciseForMenu?.exerciseDoc || null}
        onConfirm={(selectedExerciseIds) => {
          const newGroup = new Set(selectedExerciseIds);

          setSupersetGroups((prev) => {
            // remove selected ids from existing groups
            const updatedGroups = prev
              .map((g) => {
                const ng = new Set(g);
                selectedExerciseIds.forEach((id) => ng.delete(id));
                return ng;
              })
              .filter((g) => g.size > 0);

            // add new group only if it has more than one exercise
            if (newGroup.size > 1) {
              updatedGroups.push(newGroup);
            }

            return updatedGroups;
          });
        }}
      />
    </div>
  );
}
