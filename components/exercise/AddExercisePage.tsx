"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { exerciseApi, Exercise, workoutApi, Workout } from "@/lib/api";
import { ExerciseCard } from "@/components/exercise/ExerciseCard";
import { ExerciseVideoModal } from "@/components/exercise/ExerciseVideoModal";
import EquipmentModal from "@/components/EquipmentsModal";
import MuscleModal from "@/components/MuscleModal";

// Remove " (Something)" at the end of a name, e.g. "Chest (Dumbbell)" → "Chest"
const stripEquipmentFromName = (name: string) =>
    name.replace(/\s*\([^)]*\)\s*$/, "");

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AddExercisePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get("from"); // null | "edit"

    const pathname = usePathname();

    const isReplaceMode = searchParams.get("mode") === "replace";

    // 🔹 Detect where this page is used:
    //    /workout/new-routine/...  => routine builder
    //    /workout/quick-start/...  => quick-start workout
    const isRoutineSource = pathname.includes("/new-routine");

    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
        null
    );
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [selectedExerciseIds, setSelectedExerciseIds] = useState<
        Set<string>
    >(new Set());
    const [loading, setLoading] = useState(true);
    const [loadingCustom, setLoadingCustom] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pagination, setPagination] = useState<{
        total: number;
        pages: number;
    } | null>(null);

    const [isEquipOpen, setIsEquipOpen] = useState(false);
    const [equipment, setEquipment] = useState<string>("all");
    const [isMuscleOpen, setIsMuscleOpen] = useState(false);
    const [muscle, setMuscle] = useState<string>("all");

    useEffect(() => {
        fetchExercises(1, false);
        fetchCustomExercises();

        const handleCustomUpdated = () => {
            fetchCustomExercises();
        };

        window.addEventListener("customExerciseUpdated", handleCustomUpdated);

        return () => {
            window.removeEventListener("customExerciseUpdated", handleCustomUpdated);
        };
    }, []);

    // map UI equipment keys -> backend/schema enum keys
    const equipmentKeyMap: Record<string, string> = {
        all: "all",
        none: "other",
        barbell: "barbell",
        dumbell: "dumbbell",
        kettlebell: "kettlebell",
        machine: "machine",
        plate: "plate",
        rband: "rband",
        sband: "sband",
        other: "other",
    };

    const buildFetchParams = (
        pageNum: number = 1,
        overrides: Partial<{
            search: string;
            equipment: string;
            muscle: string;
            limit: number;
            isCustom: string;
        }> = {}
    ) => {
        const params: any = {
            page: pageNum,
            limit: overrides.limit ?? 200,
        };

        const searchVal = overrides.search ?? searchQuery;
        const equipmentVal = overrides.equipment ?? equipment;
        const muscleVal = overrides.muscle ?? muscle;
        const isCustomVal = overrides.isCustom;

        if (searchVal && String(searchVal).trim().length > 0)
            params.search = String(searchVal).trim();

        if (equipmentVal && equipmentVal !== "all") {
            const mapped = equipmentKeyMap[equipmentVal] ?? equipmentVal;
            params.equipment = mapped;
        }

        if (muscleVal && muscleVal !== "all") {
            params.muscle = muscleVal;
        }

        if (typeof isCustomVal !== "undefined") {
            params.isCustom = isCustomVal;
        }

        return params;
    };

    const fetchExercises = async (
        pageNum: number = 1,
        append: boolean = false,
        overrides: Partial<{
            equipment: string;
            muscle: string;
            search: string;
            isCustom: string;
        }> = {}
    ) => {
        try {
            if (append) setLoadingMore(true);
            else setLoading(true);
            setError(null);

            const params = buildFetchParams(pageNum, {
                ...overrides,
                isCustom: overrides.isCustom ?? "false",
            });

            const response = await exerciseApi.getAll(params);

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
                setError("Failed to load exercises. Please try again.");
            }
        } catch (err) {
            console.error("Error fetching exercises:", err);
            setError("Failed to load exercises. Please try again.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const fetchCustomExercises = async () => {
        try {
            setLoadingCustom(true);
            const res = await fetch(`${API_BASE}/api/exercises/custom`, {
                credentials: "include",
            });
            const json = await res.json();
            if (res.ok && json.success) {
                setCustomExercises(json.data);
            } else {
                console.error("Failed to fetch custom exercises:", json);
            }
        } catch (err) {
            console.error("Error fetching custom exercises:", err);
        } finally {
            setLoadingCustom(false);
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
            const params = buildFetchParams(1, {
                search: searchQuery,
                isCustom: "false",
            });
            const response = await exerciseApi.getAll(params);
            if (response.success) {
                setExercises(response.data);
                setPagination(response.pagination);
                setHasMore(1 < response.pagination.pages);
            } else {
                setError("Search failed. Please try again.");
            }
        } catch (error) {
            console.error("Error searching exercises:", error);
            setError("Failed to search exercises. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    /**
     * ✅ Handles:
     *  - Replace inside NEW ROUTINE (sessionStorage "newRoutineDraft")
     *  - Replace inside QUICK-START (localStorage "workoutExercises")
     *  - Non-replace selection (for adding)
     */
    const handleExerciseClick = (exercise: Exercise) => {
        // If we came here in "replace" mode, a single tap should immediately replace
        if (isReplaceMode) {
            const replaceExerciseId = sessionStorage.getItem("replaceExerciseId");

            if (replaceExerciseId) {
                // 🔹 0) EDIT FINISHED WORKOUT – replace inside workoutToEdit
                if (from === "edit") {
                    const stored = sessionStorage.getItem("workoutToEdit");
                    if (stored) {
                        try {
                            const workout: Workout = JSON.parse(stored);

                            const updatedExercises = (workout.exercises || []).map((we: any) => {
                                const id =
                                    typeof we.exerciseId === "object" && we.exerciseId !== null
                                        ? (we.exerciseId as any)._id
                                        : (we.exerciseId as string);

                                if (id === replaceExerciseId) {
                                    // keep sets / notes / order / restTimerSeconds, only swap exercise
                                    return {
                                        ...we,
                                        // store full exercise doc so Finish page can show correct info
                                        exerciseId: exercise,
                                    };
                                }
                                return we;
                            });

                            const updatedWorkout: Workout = {
                                ...workout,
                                exercises: updatedExercises,
                            };

                            sessionStorage.setItem(
                                "workoutToEdit",
                                JSON.stringify(updatedWorkout)
                            );
                            sessionStorage.removeItem("replaceExerciseId");

                            // go back to Edit Workout finish page
                            router.push("/workout/quick-start/finish-workout?mode=edit");
                            return;
                        } catch (e) {
                            console.error("Error replacing in workoutToEdit:", e);
                        }
                    }
                }
                let didReplace = false;

                // 🔹 1) Try to replace inside the routine draft (newRoutineDraft)
                try {
                    const draftStr = sessionStorage.getItem("newRoutineDraft");
                    if (draftStr) {
                        const draft = JSON.parse(draftStr);
                        const existingExercises: any[] = Array.isArray(draft.exercises)
                            ? draft.exercises
                            : [];

                        const updatedExercises = existingExercises.map((item: any) => {
                            // try several possible shapes to find the id
                            const itemId =
                                item?.exercise?._id ??         // { exercise: { _id, ... } }
                                item?.exerciseId ??            // { exerciseId: "..." }
                                item?._id ??                   // { _id: "..." }
                                undefined;

                            if (itemId === replaceExerciseId) {
                                didReplace = true;
                                // ✅ when replacing in a routine: reset sets/notes/rest timer
                                return {
                                    ...item,
                                    exercise,
                                    sets: [],
                                    notes: "",
                                    restTimerSeconds: 35, // or 0 if you want OFF
                                };
                            }
                            return item;
                        });

                        // 🔹 If we updated either place, finish the flow
                        if (didReplace) {
                            sessionStorage.removeItem("replaceExerciseId");

                            // ✅ If we came from a routine (new or edit), navigate explicitly
                            const draftStr = sessionStorage.getItem("newRoutineDraft");
                            if (draftStr) {
                                try {
                                    const draft = JSON.parse(draftStr) as { routineId?: string };
                                    if (draft.routineId) {
                                        // came from Edit Routine
                                        router.push(`/workout/edit-routine?id=${draft.routineId}`);
                                        return;
                                    }
                                } catch (e) {
                                    console.error("Error reading routineId from draft in replace:", e);
                                }
                            }

                            // fallback – works for Create Routine + Quick Start
                            router.back();          // returns to previous screen
                            return;
                        }

                    }
                } catch (e) {
                    console.error("Error replacing exercise in routine draft:", e);
                }

                // 🔹 2) Try to replace inside quick-start builder (localStorage workoutExercises)
                try {
                    const existingExercisesJson = localStorage.getItem("workoutExercises");
                    if (existingExercisesJson) {
                        const existingExercises = JSON.parse(existingExercisesJson);

                        const idx = existingExercises.findIndex((ex: any) => {
                            const exId = ex?._id ?? ex?.exerciseId ?? undefined;
                            return exId === replaceExerciseId;
                        });

                        if (idx !== -1) {
                            existingExercises[idx] = exercise;
                            localStorage.setItem(
                                "workoutExercises",
                                JSON.stringify(existingExercises)
                            );
                            window.dispatchEvent(new Event("workoutExercisesUpdated"));
                            didReplace = true;
                        }
                    }
                } catch (e) {
                    console.error("Error replacing exercise in quick-start list:", e);
                }

                // 🔹 If we updated either place, finish the flow: clear id & go back
                if (didReplace) {
                    sessionStorage.removeItem("replaceExerciseId");
                    router.back();          // returns to Create Routine / Quick Start screen
                    return;
                }
            }
        }

        // 🔹 Not in replace mode (or nothing found to replace) → just toggle selection
        setSelectedExerciseIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(exercise._id)) newSet.delete(exercise._id);
            else newSet.add(exercise._id);
            return newSet;
        });
    };


    const handleVideoIconClick = (
        exercise: Exercise,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();
        if (exercise.gifUrl || exercise.videoUrl) {
            setSelectedExercise(exercise);
            setShowVideoModal(true);
        }
    };

    const handleCreate = () => {
        router.push("/workout/quick-start/create-exercise");
    };

    // 🔹 Cancel depends on source
    const handleCancel = () => {
        // Coming from FinishWorkoutPage edit mode
        if (from === "edit") {
            router.push("/workout/quick-start/finish-workout?mode=edit");
            return;
        }

        if (isRoutineSource) {
            router.push("/workout/new-routine");
        } else {
            router.push("/workout/quick-start");
        }
    };


    // 🔹 Add exercises (non-replace) – routine vs quick-start vs edit-finish
    const handleAddExercises = async () => {
        const selectedExercises = [...exercises, ...customExercises].filter(
            (exercise) => selectedExerciseIds.has(exercise._id)
        );

        if (selectedExercises.length === 0) return;

        // 👉 CASE 0: Coming from FinishWorkoutPage (Edit Workout)
        if (from === "edit") {
            const stored = sessionStorage.getItem("workoutToEdit");
            if (!stored) {
                console.error("No workoutToEdit found in sessionStorage");
                router.push("/home");
                return;
            }

            let workout: Workout;
            try {
                workout = JSON.parse(stored) as Workout;
            } catch (e) {
                console.error("Error parsing workoutToEdit:", e);
                router.push("/home");
                return;
            }

            // existing exercise ids in this historical workout
            const existingIds = new Set(
                (workout.exercises || []).map((we: any) => {
                    if (typeof we.exerciseId === "object" && we.exerciseId !== null) {
                        return (we.exerciseId as any)._id as string;
                    }
                    return we.exerciseId as string;
                })
            );

            const baseLength = (workout.exercises || []).length;

            // build new exercise entries (avoid duplicates)
            const newWorkoutExercises: Workout["exercises"] = selectedExercises
                .filter((ex) => !existingIds.has(ex._id))
                .map((ex, idx) => ({
                    exerciseId: ex._id,
                    sets: [
                        {
                            setNumber: 1,
                            previous: "-",
                            kg: 0,
                            reps: 0,
                            completed: false,
                        },
                    ],
                    restTimerSeconds: 0,
                    notes: "",                      // ✅ required by WorkoutExercise
                    order: baseLength + idx,        // ✅ required by WorkoutExercise
                })) as Workout["exercises"];

            const updatedWorkout: Workout = {
                ...workout,
                exercises: [
                    ...(workout.exercises || []),
                    ...newWorkoutExercises,
                ] as Workout["exercises"],
            };

            sessionStorage.setItem("workoutToEdit", JSON.stringify(updatedWorkout));

            // go back to Finish Workout in edit mode
            router.push("/workout/quick-start/finish-workout?mode=edit");
            return;
        }

        // 👉 CASE 1: Adding exercises for a ROUTINE
        if (isRoutineSource) {
            try {
                const draftStr = sessionStorage.getItem("newRoutineDraft");
                let draft: { name?: string; exercises?: any[] } = {};

                if (draftStr) {
                    draft = JSON.parse(draftStr);
                }

                const existingExercises: any[] = draft.exercises || [];
                const existingIds = new Set(
                    existingExercises.map((re) => re.exercise?._id)
                );

                const newRoutineExercises = selectedExercises
                    .filter((ex) => !existingIds.has(ex._id))
                    .map((ex) => ({
                        exercise: ex,
                        sets: [],
                        notes: "",
                    }));

                const updatedDraft = {
                    ...draft,
                    exercises: [...existingExercises, ...newRoutineExercises],
                };

                sessionStorage.setItem("newRoutineDraft", JSON.stringify(updatedDraft));
            } catch (error) {
                console.error("Error updating routine draft:", error);
            }

            router.push("/workout/new-routine");
            return;
        }

        // 👉 CASE 2: Quick-start flow (existing behaviour)
        try {
            const workoutResponse = await workoutApi.getActive();
            let currentExercises: Exercise[] = [];
            let currentSupersetGroups: string[][] = [];
            let currentDuration = 0;
            let startTime: number | undefined = undefined;

            if (workoutResponse.data) {
                currentExercises = workoutResponse.data.exercises.map((ex: any) => {
                    const base =
                        typeof ex.exerciseId === "object"
                            ? ex.exerciseId
                            : { _id: ex.exerciseId };

                    return {
                        ...(base as Exercise),
                        restTimerSeconds: ex.restTimerSeconds ?? 0,
                    } as Exercise & { restTimerSeconds?: number };
                });

                currentSupersetGroups =
                    (workoutResponse.data.supersetGroups ?? []).map((group: any) => {
                        const rawIds = Array.isArray(group)
                            ? group
                            : group.exerciseIds ?? [];

                        return rawIds.map((id: unknown) => {
                            if (typeof id === "object" && id !== null && "_id" in id) {
                                return (id as { _id?: string })._id ?? "";
                            }
                            return String(id);
                        });
                    });

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

            const exerciseMap = new Map<string, Exercise>();
            currentExercises.forEach((ex) => exerciseMap.set(ex._id, ex));
            selectedExercises.forEach((ex) =>
                exerciseMap.set(
                    ex._id,
                    { ...ex, restTimerSeconds: 0 } as Exercise & {
                        restTimerSeconds?: number;
                    }
                )
            );
            const allExercises = Array.from(exerciseMap.values());

            await workoutApi.save({
                exercises: allExercises,
                supersetGroups: currentSupersetGroups,
                duration: currentDuration,
                startTime,
            });

            window.dispatchEvent(new Event("workoutExercisesUpdated"));
            router.push("/workout/quick-start");
        } catch (error) {
            console.error("Error adding exercises to workout:", error);
        }
    };


    const filteredPopular = exercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCustom = customExercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const customIds = new Set(filteredCustom.map((ex) => ex._id));

    const clearAllFilters = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEquipment("all");
        setMuscle("all");
        fetchExercises(1, false, {
            equipment: "all",
            muscle: "all",
            isCustom: "false",
        });
    };

    // equipment handlers
    const handleOnAllEquipment = () => {
        setEquipment("all");
        setIsEquipOpen(false);
        fetchExercises(1, false, { equipment: "all", isCustom: "false" });
    };
    const handleOnNone = () => {
        setEquipment("none");
        setIsEquipOpen(false);
        fetchExercises(1, false, { equipment: "none", isCustom: "false" });
    };
    const handleOnBarbell = () => {
        setEquipment("barbell");
        setIsEquipOpen(false);
        fetchExercises(1, false, {
            equipment: "barbell",
            isCustom: "false",
        });
    };
    const handleOnDumbell = () => {
        setEquipment("dumbell");
        setIsEquipOpen(false);
        fetchExercises(1, false, {
            equipment: "dumbell",
            isCustom: "false",
        });
    };
    const handleOnKettlebell = () => {
        setEquipment("kettlebell");
        setIsEquipOpen(false);
        fetchExercises(1, false, {
            equipment: "kettlebell",
            isCustom: "false",
        });
    };
    const handleOnMachine = () => {
        setEquipment("machine");
        setIsEquipOpen(false);
        fetchExercises(1, false, {
            equipment: "machine",
            isCustom: "false",
        });
    };
    const handleOnPlate = () => {
        setEquipment("plate");
        setIsEquipOpen(false);
        fetchExercises(1, false, {
            equipment: "plate",
            isCustom: "false",
        });
    };
    const handleOnRBand = () => {
        setEquipment("rband");
        setIsEquipOpen(false);
        fetchExercises(1, false, { equipment: "rband", isCustom: "false" });
    };
    const handleOnSBand = () => {
        setEquipment("sband");
        setIsEquipOpen(false);
        fetchExercises(1, false, { equipment: "sband", isCustom: "false" });
    };
    const handleOnOther = () => {
        setEquipment("other");
        setIsEquipOpen(false);
        fetchExercises(1, false, { equipment: "other", isCustom: "false" });
    };

    // muscle handlers
    const handleOnAllMuscle = () => {
        setMuscle("all");
        setIsMuscleOpen(false);
        fetchExercises(1, false, { muscle: "all", isCustom: "false" });
    };
    const handleOnArms = () => {
        setMuscle("arms");
        setIsMuscleOpen(false);
        fetchExercises(1, false, { muscle: "arms", isCustom: "false" });
    };
    const handleOnBack = () => {
        setMuscle("back");
        setIsMuscleOpen(false);
        fetchExercises(1, false, { muscle: "back", isCustom: "false" });
    };
    const handleOnChest = () => {
        setMuscle("chest");
        setIsMuscleOpen(false);
        fetchExercises(1, false, { muscle: "chest", isCustom: "false" });
    };
    const handleOnCore = () => {
        setMuscle("core");
        setIsMuscleOpen(false);
        fetchExercises(1, false, { muscle: "core", isCustom: "false" });
    };
    const handleOnCardio = () => {
        setMuscle("cardio");
        setIsMuscleOpen(false);
        fetchExercises(1, false, { muscle: "cardio", isCustom: "false" });
    };
    const handleOnLegs = () => {
        setMuscle("legs");
        setIsMuscleOpen(false);
        fetchExercises(1, false, { muscle: "legs", isCustom: "false" });
    };
    const handleOnShoulders = () => {
        setMuscle("shoulders");
        setIsMuscleOpen(false);
        fetchExercises(1, false, {
            muscle: "shoulders",
            isCustom: "false",
        });
    };
    const handleOnOtherMuscle = () => {
        setMuscle("other");
        setIsMuscleOpen(false);
        fetchExercises(1, false, { muscle: "other", isCustom: "false" });
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-background">
            {/* Header */}
            <header className="flex-shrink-0 bg-background border-b border-border">
                <div className="flex items-center justify-between h-16 px-4">
                    <Button
                        variant="ghost"
                        onClick={handleCancel}
                        className="h-10 px-0 hover:bg-transparent"
                        aria-label="Go back"
                    >
                        <span className="text-lg font-regular text-blue-600">
                            Cancel
                        </span>
                    </Button>

                    <h1 className="text-lg font-regular capitalize">
                        {isReplaceMode ? "Replace Exercise" : "add exercise"}
                    </h1>

                    <Button
                        variant="ghost"
                        onClick={handleCreate}
                        className="h-10 px-0 hover:bg-transparent"
                        aria-label="Create"
                    >
                        <span className="text-lg font-regular text-blue-600">
                            Create
                        </span>
                    </Button>
                </div>
            </header>

            {/* Search + filters */}
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
      ${equipment && equipment !== "all"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-black"
                            }
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
      ${muscle && muscle !== "all"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-black"
                            }
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

                {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                )}
            </div>

            {/* Scrollable list */}
            <div
                className="flex-1 overflow-y-auto"
                onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    const scrollBottom =
                        target.scrollHeight -
                        target.scrollTop -
                        target.clientHeight;
                    if (scrollBottom < 200 && !loadingMore && hasMore) {
                        loadMoreExercises();
                    }
                }}
            >
                <div className="space-y-10 px-4">
                    {/* Custom Exercises */}
                    {filteredCustom.length > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-base font-semibold text-gray-700">
                                    Custom Exercises ({filteredCustom.length})
                                </h2>
                            </div>

                            <div className="space-y-2">
                                {filteredCustom.map((exercise) => (
                                    <ExerciseCard
                                        key={exercise._id}
                                        exercise={exercise}
                                        isSelected={selectedExerciseIds.has(exercise._id)}
                                        onClick={() => handleExerciseClick(exercise)}
                                        onVideoClick={(e) =>
                                            handleVideoIconClick(exercise, e)
                                        }
                                        variant="custom"
                                        displayTitle={stripEquipmentFromName(
                                            exercise.name
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Exercises */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-700 mb-2">
                            All Exercises
                        </h2>

                        <div className="space-y-2">
                            {filteredPopular.map((exercise) => (
                                <ExerciseCard
                                    key={exercise._id}
                                    exercise={exercise}
                                    isSelected={selectedExerciseIds.has(exercise._id)}
                                    onClick={() => handleExerciseClick(exercise)}
                                    onVideoClick={(e) =>
                                        handleVideoIconClick(exercise, e)
                                    }
                                />
                            ))}
                        </div>

                        {loadingMore && (
                            <div className="text-center py-4 text-gray-500">
                                Loading more exercises...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom button – NOT visible in replace mode */}
            {selectedExerciseIds.size > 0 && !isReplaceMode && (
                <div className="flex-shrink-0 p-4 bg-background">
                    <Button
                        onClick={handleAddExercises}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-regular text-lg"
                    >
                        Add {selectedExerciseIds.size}{" "}
                        {selectedExerciseIds.size === 1
                            ? "exercise"
                            : "exercises"}
                    </Button>
                </div>
            )}

            <ExerciseVideoModal
                exercise={selectedExercise}
                open={showVideoModal}
                onClose={() => setShowVideoModal(false)}
            />

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
