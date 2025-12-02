"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { exerciseApi, Exercise, workoutApi } from "@/lib/api";
import { ExerciseCard } from "@/components/exercise/ExerciseCard";
import { ExerciseVideoModal } from "@/components/exercise/ExerciseVideoModal";
import EquipmentModal from "@/components/EquipmentsModal"; // <-- import your modal
import MuscleModal from "@/components/MuscleModal";

export default function AddExercisePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReplaceMode = searchParams.get("mode") === "replace";
  const isRoutineMode = searchParams.get("mode") === "routine";
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<{ total: number; pages: number } | null>(null);

  // New states for Equipment modal
  const [isEquipOpen, setIsEquipOpen] = useState(false);
  const [equipment, setEquipment] = useState<string>("all"); // store the selected equipment key

  const [isMuscleOpen, setIsMuscleOpen] = useState(false);
  const [muscle, setMuscle] = useState<string>("all");

  useEffect(() => {
    fetchExercises();
  }, []);

  // Add inside your component, replacing existing fetchExercises & handleSearch

  // map UI equipment keys -> backend/schema enum keys
  const equipmentKeyMap: Record<string, string> = {
    all: 'all',
    none: 'bodyweight', // interpret 'none' as bodyweight if that fits your app
    barbell: 'barbell',
    dumbell: 'dumbbell', // note correction: 'dumbbell' (schema uses 'dumbbell')
    kettlebell: 'kettlebell',
    machine: 'machine',
    plate: 'other', // if 'plate' isn't in schema, map to 'other' or add to schema
    rband: 'other',
    sband: 'other',
    other: 'other'
  };

  // build params using current state + overrides (overrides let us call immediately with chosen value)
  const buildFetchParams = (pageNum: number = 1, overrides: Partial<{ search: string; equipment: string; muscle: string; limit: number }> = {}) => {
    const params: any = {
      page: pageNum,
      limit: overrides.limit ?? 200,
    };

    const searchVal = overrides.search ?? searchQuery;
    const equipmentVal = overrides.equipment ?? equipment;
    const muscleVal = overrides.muscle ?? muscle;

    if (searchVal && String(searchVal).trim().length > 0) params.search = String(searchVal).trim();

    // normalize equipment to backend keys
    if (equipmentVal && equipmentVal !== 'all') {
      const mapped = equipmentKeyMap[equipmentVal] ?? equipmentVal;
      params.equipment = mapped;
    }

    if (muscleVal && muscleVal !== 'all') {
      params.muscle = muscleVal;
    }

    return params;
  };

  const fetchExercises = async (pageNum: number = 1, append: boolean = false, overrides: Partial<{ equipment: string; muscle: string; search: string }> = {}) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const params = buildFetchParams(pageNum, overrides);

      console.log('Fetching exercises with params:', params);

      const response = await exerciseApi.getAll(params);
      console.log('Exercises response:', response);

      if (response.success) {
        if (append) {
          setExercises((prev) => [...prev, ...response.data]);
        } else {
          setExercises(response.data);
        }
        setPagination(response.pagination);
        setHasMore(pageNum < response.pagination.pages);
        setPage(pageNum);
      } else {
        setError('Failed to load exercises. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError('Failed to load exercises. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreExercises = () => {
    if (!loadingMore && hasMore) {
      fetchExercises(page + 1, true);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      setPage(1);
      const params = buildFetchParams(1, { search: searchQuery });
      const response = await exerciseApi.getAll(params);
      if (response.success) {
        setExercises(response.data);
        setPagination(response.pagination);
        setHasMore(1 < response.pagination.pages);
      } else {
        setError('Search failed. Please try again.');
      }
    } catch (error) {
      console.error('Error searching exercises:', error);
      setError('Failed to search exercises. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseClick = (exercise: Exercise) => {
    // If in replace mode, immediately replace and navigate back
    if (isReplaceMode) {
      const replaceExerciseId = sessionStorage.getItem("replaceExerciseId");

      if (replaceExerciseId) {
        // Get existing workout exercises from localStorage
        const existingExercisesJson = localStorage.getItem("workoutExercises");
        const existingExercises = existingExercisesJson ? JSON.parse(existingExercisesJson) : [];

        // Find the index of the exercise to replace
        const replaceIndex = existingExercises.findIndex((ex: Exercise) => ex._id === replaceExerciseId);

        if (replaceIndex !== -1) {
          // Replace the exercise at that index with the selected one
          const newExercises = [...existingExercises];
          newExercises[replaceIndex] = exercise;

          // Save back to localStorage
          localStorage.setItem("workoutExercises", JSON.stringify(newExercises));

          // Dispatch a custom event to notify other components
          window.dispatchEvent(new Event("workoutExercisesUpdated"));

          // Clear the replace exercise ID from sessionStorage
          sessionStorage.removeItem("replaceExerciseId");

          console.log("Replaced exercise:", exercise);
          router.back();
          return;
        }
      }
    }

    // Normal mode: toggle selection
    setSelectedExerciseIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(exercise._id)) {
        newSet.delete(exercise._id);
      } else {
        newSet.add(exercise._id);
      }
      return newSet;
    });
  };

  const handleVideoIconClick = (exercise: Exercise, e: React.MouseEvent) => {
    e.stopPropagation();
    if (exercise.gifUrl || exercise.videoUrl) {
      setSelectedExercise(exercise);
      setShowVideoModal(true);
    }
  };

  const handleCreate = () => {
    // Add logic to add selected exercise to workout
    window.location.reload();
  };

  const handleAddExercises = async () => {
    // Get selected exercises from the exercises list
    const selectedExercises = exercises.filter((exercise) => selectedExerciseIds.has(exercise._id));

    if (selectedExercises.length === 0) {
      return;
    }

    // (routine + replace + add logic unchanged) ...
    // (kept for brevity — paste your existing logic here)
    try {
      const workoutResponse = await workoutApi.getActive();
      let currentExercises: Exercise[] = [];
      let currentSupersetGroups: string[][] = [];
      let currentDuration = 0;
      let startTime: number | undefined = undefined;

      if (workoutResponse.data) {
        currentExercises = workoutResponse.data.exercises.map((ex) => {
          const exercise = typeof ex.exerciseId === "object" ? ex.exerciseId : { _id: ex.exerciseId };
          return exercise as Exercise;
        });

        currentSupersetGroups = (workoutResponse.data.supersetGroups ?? []).map((group) =>
          (group.exerciseIds ?? []).map((id: unknown) => {
            if (typeof id === "object" && id !== null && "_id" in id) {
              return (id as { _id?: string })._id ?? "";
            }
            return String(id);
          })
        );

        currentDuration = workoutResponse.data.duration || 0;

        if (workoutResponse.data.startTime) {
          startTime = new Date(workoutResponse.data.startTime).getTime();
        }
      } else {
        const storedStartTime = localStorage.getItem("workoutStartTime");
        if (storedStartTime) {
          startTime = parseInt(storedStartTime, 10);
        } else {
          startTime = Date.now();
          localStorage.setItem("workoutStartTime", startTime.toString());
        }
      }

      // Replace mode handling...
      if (isReplaceMode) {
        const replaceExerciseId = sessionStorage.getItem("replaceExerciseId");

        if (replaceExerciseId && selectedExercises.length > 0) {
          const replaceIndex = currentExercises.findIndex((ex: Exercise) => ex._id === replaceExerciseId);

          if (replaceIndex !== -1) {
            const newExercises = [...currentExercises];
            newExercises[replaceIndex] = selectedExercises[0];

            await workoutApi.save({
              exercises: newExercises,
              supersetGroups: currentSupersetGroups,
              duration: currentDuration,
              startTime: startTime,
            });

            window.dispatchEvent(new Event("workoutExercisesUpdated"));
            sessionStorage.removeItem("replaceExerciseId");
            router.back();
            return;
          }
        }
      }

      // Normal add mode: combine and save
      const exerciseMap = new Map<string, Exercise>();
      currentExercises.forEach((ex: Exercise) => exerciseMap.set(ex._id, ex));
      selectedExercises.forEach((ex: Exercise) => exerciseMap.set(ex._id, ex));
      const allExercises = Array.from(exerciseMap.values());

      await workoutApi.save({
        exercises: allExercises,
        supersetGroups: currentSupersetGroups,
        duration: currentDuration,
        startTime: startTime,
      });

      window.dispatchEvent(new Event("workoutExercisesUpdated"));
      router.back();
    } catch (error) {
      console.error("Error adding exercises to workout:", error);
    }
  };

  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearAllFilters = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEquipment("all");
    setMuscle("all");
    fetchExercises(1, false, { equipment: "all", muscle: "all" });
  };


  const handleOnAllEquipment = () => {
    setEquipment("all");
    setIsEquipOpen(false);
    fetchExercises(1, false, { equipment: "all" });
  };
  const handleOnNone = () => {
    setEquipment("none");
    setIsEquipOpen(false);
    fetchExercises(1, false, { equipment: "none" });
  };
  const handleOnBarbell = () => {
    setEquipment("barbell");
    setIsEquipOpen(false);
    fetchExercises(1, false, { equipment: "barbell" });
  };
  const handleOnDumbell = () => {
    setEquipment("dumbell");
    setIsEquipOpen(false);
    fetchExercises(1, false, { equipment: "dumbell" });
  };
  const handleOnKettlebell = () => {
    setEquipment("kettlebell");
    setIsEquipOpen(false);
    fetchExercises(1, false, { equipment: "kettlebell" });
  };
  const handleOnMachine = () => {
    setEquipment("machine");
    setIsEquipOpen(false);
    fetchExercises(1, false, { equipment: "machine" });
  };
  const handleOnPlate = () => {
    setEquipment("plate");
    setIsEquipOpen(false);
    fetchExercises(1, false, { equipment: "plate" });
  };
  const handleOnRBand = () => {
    setEquipment("rband");
    setIsEquipOpen(false);
    fetchExercises(1, false, { equipment: "rband" });
  };
  const handleOnSBand = () => {
    setEquipment("sband");
    setIsEquipOpen(false);
    fetchExercises(1, false, { equipment: "sband" });
  };
  const handleOnOther = () => {
    setEquipment("other");
    setIsEquipOpen(false);
    fetchExercises(1, false, { equipment: "other" });
  };

  const handleOnAllMuscle = () => {
    setMuscle("all");
    setIsMuscleOpen(false);
    fetchExercises(1, false, { muscle: "all" });
  };
  const handleOnArms = () => {
    setMuscle("arms");
    setIsMuscleOpen(false);
    fetchExercises(1, false, { muscle: "arms" });
  };
  const handleOnBack = () => {
    setMuscle("back");
    setIsMuscleOpen(false);
    fetchExercises(1, false, { muscle: "back" });
  };
  const handleOnChest = () => {
    setMuscle("chest");
    setIsMuscleOpen(false);
    fetchExercises(1, false, { muscle: "chest" });
  };
  const handleOnCore = () => {
    setMuscle("core");
    setIsMuscleOpen(false);
    fetchExercises(1, false, { muscle: "core" });
  };
  const handleOnCardio = () => {
    setMuscle("cardio");
    setIsMuscleOpen(false);
    fetchExercises(1, false, { muscle: "cardio" });
  };
  const handleOnLegs = () => {
    setMuscle("legs");
    setIsMuscleOpen(false);
    fetchExercises(1, false, { muscle: "legs" });
  };
  const handleOnShoulders = () => {
    setMuscle("shoulders");
    setIsMuscleOpen(false);
    fetchExercises(1, false, { muscle: "shoulders" });
  };
  const handleOnOtherMuscle = () => {
    setMuscle("other");
    setIsMuscleOpen(false);
    fetchExercises(1, false, { muscle: "other" });
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Fixed Header */}
      <header className="flex-shrink-0 bg-background border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-10 px-0 hover:bg-transparent"
            aria-label="Go back"
          >
            <span className="text-lg font-regular text-blue-600">Cancel</span>
          </Button>

          <h1 className="text-lg font-regular capitalize">{isReplaceMode ? "Replace Exercise" : "add exercise"}</h1>

          <Button
            variant="ghost"
            onClick={handleCreate}
            className="h-10 px-0 hover:bg-transparent"
            aria-label="Create"
          >
            <span className="text-lg font-regular text-blue-600">Create</span>
          </Button>
        </div>
      </header>

      {/* Fixed Search and Filter Section */}
      <div className="flex-shrink-0 p-4 space-y-4 bg-background">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 size-5 text-gray-400 pointer-events-none z-10" />
          <Input
            placeholder="Search exercise"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-12 pl-12 pr-4 text-base rounded-[8px] bg-gray-100 border-none outline-none placeholder:text-gray-400 transition-colors"
          />
        </div>

        <div className="flex flex-row items-center gap-3">
          {/* Equipment Button */}
          <button
            type="button"
            onClick={() => setIsEquipOpen(true)}
            className={`relative flex items-center justify-center flex-1 px-4 py-3 h-auto text-base rounded-[8px] border-none font-regular transition-colors
      ${equipment && equipment !== "all" ? "bg-blue-500 text-white" : "bg-gray-100 text-black"}
    `}
          >
            <span className="truncate">
              {equipment === "all"
                ? "All Equipment"
                : equipment === "none"
                  ? "None"
                  : equipment === "barbell"
                    ? "Barbell"
                    : equipment === "dumbell"
                      ? "Dumbell"
                      : equipment === "kettlebell"
                        ? "Kettlebell"
                        : equipment === "machine"
                          ? "Machine"
                          : equipment === "plate"
                            ? "Plate"
                            : equipment === "rband"
                              ? "Resistance Band"
                              : equipment === "sband"
                                ? "Suspension Band"
                                : "Other"}
            </span>
          </button>

          {/* Muscle Button */}
          <button
            type="button"
            onClick={() => setIsMuscleOpen(true)}
            className={`relative flex items-center justify-center flex-1 px-4 py-3 h-auto text-base rounded-[8px] border-none font-regular transition-colors
      ${muscle && muscle !== "all" ? "bg-blue-500 text-white" : "bg-gray-100 text-black"}
    `}
          >
            <span className="truncate">
              {muscle === "all"
                ? "All Muscles"
                : muscle === "none"
                  ? "None"
                  : muscle === "arms"
                    ? "Arms"
                    : muscle === "back"
                      ? "Back"
                      : muscle === "chest"
                        ? "Chest"
                        : muscle === "core"
                          ? "Core"
                          : muscle === "cardio"
                            ? "Cardio"
                            : muscle === "legs"
                              ? "Legs"
                              : muscle === "shoulders"
                                ? "Shoulders"
                                : "Other"}
            </span>
          </button>

          {(equipment !== "all" || muscle !== "all") && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-black"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>


        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>

      {/* Scrollable Exercise Cards Area */}
      <div
        className="flex-1 overflow-y-auto"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
          if (scrollBottom < 200 && !loadingMore && hasMore) {
            loadMoreExercises();
          }
        }}
      >
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading exercises...</div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? "No exercises found matching your search." : "No exercises available."}
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-black">Popular Exercises</h2>
              {filteredExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise._id}
                  exercise={exercise}
                  isSelected={selectedExerciseIds.has(exercise._id)}
                  onClick={() => handleExerciseClick(exercise)}
                  onVideoClick={(e) => handleVideoIconClick(exercise, e)}
                />
              ))}
              {loadingMore && <div className="text-center py-4 text-gray-500">Loading more exercises...</div>}
              {!hasMore && filteredExercises.length > 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">All exercises loaded ({filteredExercises.length} total)</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Button - Appears when exercises are selected (only in normal add mode) */}
      {selectedExerciseIds.size > 0 && !isReplaceMode && (
        <div className="flex-shrink-0 p-4 bg-background">
          <Button
            onClick={handleAddExercises}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-regular text-lg"
          >
            Add {selectedExerciseIds.size} {selectedExerciseIds.size === 1 ? "exercise" : "exercises"}
          </Button>
        </div>
      )}

      <ExerciseVideoModal exercise={selectedExercise} open={showVideoModal} onClose={() => setShowVideoModal(false)} />

      {/* Equipment Modal */}
      <EquipmentModal
        open={isEquipOpen}
        onClose={() => setIsEquipOpen(false)}
        onAll={handleOnAllEquipment}
        onNone={handleOnNone}
        onBarbell={handleOnBarbell}
        onKettlebell={handleOnKettlebell}
        onDumbell={handleOnDumbell}
        onMachine={handleOnMachine}
        onPlate={handleOnPlate}
        onRBand={handleOnRBand}
        onSBand={handleOnSBand}
        onOther={handleOnOther}
        selectedKey={equipment}
      />

      {/* Muscle Modal */}
      <MuscleModal
        open={isMuscleOpen}
        onClose={() => setIsMuscleOpen(false)}
        onAll={handleOnAllMuscle}
        onArms={handleOnArms}
        onBack={handleOnBack}
        onChest={handleOnChest}
        onCore={handleOnCore}
        onCardio={handleOnCardio}
        onLegs={handleOnLegs}
        onShoulders={handleOnShoulders}
        onOther={handleOnOtherMuscle}
        selectedKey={muscle}
      />
    </div>
  );
}
