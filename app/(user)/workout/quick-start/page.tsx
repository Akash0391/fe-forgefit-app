"use client";

import {
  AlarmClock,
  ChevronDown,
  Dumbbell,
  Plus,
  MoreVertical,
  Clock,
  Check,
  Timer,
  CheckCheck,
  SquareCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Exercise, workoutApi, SetData, authApi } from "@/lib/api";
import { socket } from "@/lib/socket";
import TimerModal from "@/components/TimerModal";
import FinishWorkoutConfirmationModal from "@/components/FinishWorkoutConfirmationModal";
import ExerciseOptionsModal from "@/components/ExerciseOptionsModal";
import AddToSupersetModal from "@/components/AddToSupersetModal";
import { RestTimerModal } from "@/components/RestTimerModal";
import DiscardWorkoutModal from "@/components/DiscardWorkoutModal";
import { WorkoutExerciseCard } from "@/components/WorkoutExerciseCard";
import { debounce } from "@/lib/debounce";


interface ExerciseSets {
  [exerciseId: string]: SetData[];
}

const emitUpdate = debounce((payload: any) => { socket.emit("workout:update", payload); }, 400);
export default function QuickStartPage() {
  const router = useRouter();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [duration, setDuration] = useState(0); // Duration in seconds
  const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>([]);
  const [showDurationInHeader, setShowDurationInHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFinishingRef = useRef(false); // Track if workout is being finished to prevent duplicate saves
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showFinishConfirmationModal, setShowFinishConfirmationModal] =
    useState(false);
  const [finishModalMessage, setFinishModalMessage] =
    useState("Add an exercise");
  const [exerciseSets, setExerciseSets] = useState<ExerciseSets>({});
  const [selectedExerciseForMenu, setSelectedExerciseForMenu] =
    useState<Exercise | null>(null);
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [supersetGroups, setSupersetGroups] = useState<Set<string>[]>([]); // Array of sets, each set contains exercise IDs in a superset
  const [removingExerciseIds, setRemovingExerciseIds] = useState<Set<string>>(new Set()); // Track exercises being removed for animation

  const [restTimerModalExercise, setRestTimerModalExercise] =
    useState<Exercise | null>(null);
  const [restTimerModalSeconds, setRestTimerModalSeconds] = useState(0);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [activeRest, setActiveRest] = useState<{
    exerciseId: string;
    exerciseName: string;
    remaining: number; // seconds
    total: number;     // seconds
  } | null>(null);

  // ✅ LIVE TOTALS BASED ON COMPLETED SETS
  const totalSets = workoutExercises.reduce((sum, exercise) => {
    const sets = exerciseSets[exercise._id] || [];
    return sum + sets.filter((s) => s.completed).length;
  }, 0);

  const totalVolume = workoutExercises.reduce((sum, exercise) => {
    const sets = exerciseSets[exercise._id] || [];
    return (
      sum +
      sets.reduce((setSum, s) => {
        if (!s.completed) return setSum;
        return setSum + (s.kg || 0) * (s.reps || 0);
      }, 0)
    );
  }, 0);



  const formatRestTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const mm = m.toString().padStart(2, "0");
    const ss = s.toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };


  const startRestTimer = (exerciseId: string, exerciseName: string, seconds: number) => {
    if (seconds <= 0) return;

    // clear previous timer if any
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
    }

    setActiveRest({
      exerciseId,
      exerciseName,
      remaining: seconds,
      total: seconds,
    });

    restIntervalRef.current = setInterval(() => {
      setActiveRest((prev) => {
        if (!prev) return prev;
        if (prev.remaining <= 1) {
          // finished
          if (restIntervalRef.current) {
            clearInterval(restIntervalRef.current);
            restIntervalRef.current = null;
          }
          return null;
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
  };

  const adjustRestTime = (delta: number) => {
    setActiveRest((prev) => {
      if (!prev) return prev;

      // new total duration for this rest (can’t be negative)
      const newTotal = Math.max(0, prev.total + delta);

      // new remaining time (can’t be negative, and shouldn’t exceed newTotal)
      let newRemaining = Math.max(0, prev.remaining + delta);
      if (newTotal > 0) {
        newRemaining = Math.min(newRemaining, newTotal);
      }

      // if everything goes to 0, stop timer
      if (newTotal === 0 || newRemaining === 0) {
        if (restIntervalRef.current) {
          clearInterval(restIntervalRef.current);
          restIntervalRef.current = null;
        }
        return null;
      }

      return {
        ...prev,
        total: newTotal,
        remaining: newRemaining,
      };
    });
  };


  const stopRestTimer = () => {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
    setActiveRest(null);
  };


  useEffect(() => {
    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, []);



  // Format duration to display (e.g., "1m 23s", "45s", "1h 5m")
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min ${secs}s`;
    }

    if (minutes > 0) {
      return secs > 0 ? `${minutes}min ${secs}s` : `${minutes}min`;
    }

    return `${seconds}s`;
  };

  // Load workout from API (includes: copy-from-history, routine, normal flow)
  const loadWorkout = async () => {
    try {
      // 0) COPY WORKOUT → quick-start
      const copyDataStr = sessionStorage.getItem("copyWorkoutToQuickStart");
      if (copyDataStr) {
        try {
          const copyData = JSON.parse(copyDataStr);
          sessionStorage.removeItem("copyWorkoutToQuickStart");

          // exercises: [{ exercise, sets, restTimerSeconds }]
          const copiedExercises: (Exercise & { restTimerSeconds?: number })[] =
            (copyData.exercises || []).map((item: any) => ({
              ...(item.exercise as Exercise),
              restTimerSeconds: item.restTimerSeconds ?? 0,
            }));

          setWorkoutExercises(copiedExercises);

          // build sets map
          const copiedSets: ExerciseSets = {};
          (copyData.exercises || []).forEach((item: any) => {
            const ex = item.exercise as Exercise;
            const exerciseId = ex._id;

            const itemSets: SetData[] =
              item.sets && item.sets.length > 0
                ? item.sets
                : [
                  {
                    setNumber: 1,
                    previous: "-",
                    kg: 0,
                    reps: 0,
                    completed: false,
                  },
                ];

            copiedSets[exerciseId] = itemSets;
          });
          setExerciseSets(copiedSets);

          // superset groups: either string[] or { exerciseIds: string[] }
          const copiedGroups: Set<string>[] = (copyData.supersetGroups || []).map(
            (group: any) =>
              new Set(
                Array.isArray(group) ? group : group.exerciseIds || []
              )
          );
          setSupersetGroups(copiedGroups);

          // start a BRAND-NEW workout based on the copy
          const startTime = Date.now();
          localStorage.setItem("workoutStartTime", startTime.toString());
          localStorage.setItem("workoutInProgress", "true");
          setDuration(0);

          // save to backend as the new active workout
          const exercisesWithSets = copiedExercises.map((exercise) => {
            const es = copiedSets[exercise._id];
            const defaultSet: SetData[] = [
              {
                setNumber: 1,
                previous: "-",
                kg: 0,
                reps: 0,
                completed: false,
              },
            ];
            return {
              ...exercise,
              sets: es && es.length > 0 ? es : defaultSet,
            };
          });

          const supersetGroupsArray = copiedGroups.map((g) => Array.from(g));

          await workoutApi.save({
            exercises: exercisesWithSets,
            supersetGroups: supersetGroupsArray,
            duration: 0,
            startTime,
          });

          return; // ✅ done with copy flow
        } catch (err) {
          console.error("Error loading copied workout:", err);
          // fall through to normal flow if something went wrong
        }
      }

      // 1) First check if we're starting a workout from a routine
      const routineDataStr = sessionStorage.getItem("routineToWorkout");
      if (routineDataStr) {
        try {
          const routineData = JSON.parse(routineDataStr);
          sessionStorage.removeItem("routineToWorkout");

          // ✅ exercises already have restTimerSeconds on exercise
          const exercises = routineData.exercises.map(
            (ex: any) =>
              ex.exercise as Exercise & { restTimerSeconds?: number }
          );
          setWorkoutExercises(exercises);

          // ✅ sets
          const sets: ExerciseSets = {};
          routineData.exercises.forEach((ex: any) => {
            const exerciseId = ex.exercise?._id || ex.exerciseId;
            if (!ex.sets || ex.sets.length === 0) {
              sets[exerciseId] = [
                {
                  setNumber: 1,
                  previous: "-",
                  kg: 0,
                  reps: 0,
                  completed: false,
                },
              ];
            } else {
              sets[exerciseId] = ex.sets;
            }
          });
          setExerciseSets(sets);

          // ✅ superset groups
          const groups = (routineData.supersetGroups || []).map((group: any) =>
            new Set(Array.isArray(group) ? group : group.exerciseIds || [])
          );
          setSupersetGroups(groups);

          // ✅ start time & save to backend (keep timer)
          const startTime = Date.now();
          localStorage.setItem("workoutStartTime", startTime.toString());
          localStorage.setItem("workoutInProgress", "true");
          setDuration(0);

          const exercisesWithSets = exercises.map((exercise: Exercise) => {
            const exerciseSets = sets[exercise._id];
            const defaultSet = [
              {
                setNumber: 1,
                previous: "-",
                kg: 0,
                reps: 0,
                completed: false,
              },
            ];
            return {
              ...exercise,
              sets:
                exerciseSets && exerciseSets.length > 0
                  ? exerciseSets
                  : defaultSet,
              // keep timer from routine
              restTimerSeconds: (exercise as any).restTimerSeconds ?? 0,
            };
          });

          const supersetGroupsArray = groups.map((group: Set<string>) =>
            Array.from(group)
          );

          await workoutApi.save({
            exercises: exercisesWithSets,
            supersetGroups: supersetGroupsArray,
            duration: 0,
            startTime,
          });

          return; // ✅ done with routine flow
        } catch (error) {
          console.error("Error loading routine data:", error);
          // fall through to normal flow
        }
      }

      // 2) Respect workoutInProgress flag BEFORE calling getActive
      const workoutInProgress =
        localStorage.getItem("workoutInProgress") === "true";

      if (!workoutInProgress) {
        // No workout in progress → create a brand-new empty workout
        setWorkoutExercises([]);
        setExerciseSets({});
        setSupersetGroups([]);

        const startTime = Date.now();
        localStorage.setItem("workoutStartTime", startTime.toString());
        localStorage.setItem("workoutInProgress", "true");
        setDuration(0);

        await workoutApi.save({
          exercises: [],
          supersetGroups: [],
          duration: 0,
          startTime,
        });

        return;
      }


      // 3) Try to load active workout from backend (your existing logic)
      const response = await workoutApi.getActive();
      if (response.data) {
        const workout = response.data;

        localStorage.setItem("workoutInProgress", "true");

        // Extract exercises
        const exercises = workout.exercises.map((ex: any) => {
          const baseExercise =
            typeof ex.exerciseId === "object"
              ? ex.exerciseId
              : { _id: ex.exerciseId };

          return {
            ...(baseExercise as Exercise),
            restTimerSeconds: ex.restTimerSeconds ?? 0,
          } as Exercise & { restTimerSeconds?: number };
        });

        setWorkoutExercises(exercises);

        // Extract sets
        const sets: ExerciseSets = {};
        workout.exercises.forEach((ex: any) => {
          const exerciseId =
            typeof ex.exerciseId === "object"
              ? ex.exerciseId._id
              : ex.exerciseId;
          if (!ex.sets || ex.sets.length === 0) {
            sets[exerciseId] = [
              {
                setNumber: 1,
                previous: "-",
                kg: 0,
                reps: 0,
                completed: false,
              },
            ];
          } else {
            sets[exerciseId] = ex.sets;
          }
        });
        setExerciseSets(sets);

        const groups: Set<string>[] = workout.supersetGroups.map((group: any) =>
          new Set(
            group.exerciseIds.map((id: string | Exercise) =>
              typeof id === "object" && id !== null && "_id" in id
                ? (id as any)._id
                : (id as string)
            )
          )
        );
        setSupersetGroups(groups);

        // Set duration and start time
        if (workout.startTime) {
          const startTime = new Date(workout.startTime).getTime();
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setDuration(elapsed);
          localStorage.setItem("workoutStartTime", startTime.toString());
        } else {
          const startTime = Date.now();
          localStorage.setItem("workoutStartTime", startTime.toString());
          setDuration(0);
          const supersetGroupsArray = groups.map((group: Set<string>) =>
            Array.from(group)
          );
          workoutApi
            .save({
              exercises,
              supersetGroups: supersetGroupsArray,
              duration: 0,
              startTime,
            })
            .catch((err) => console.error("Error saving start time:", err));
        }
      } else {
        // 4) (your existing retry logic here – unchanged)
        // ...
      }
    } catch (error) {
      console.error("Error loading workout:", error);
      setWorkoutExercises([]);
      setExerciseSets({});
      setSupersetGroups([]);

      if (!localStorage.getItem("workoutStartTime")) {
        const startTime = Date.now();
        localStorage.setItem("workoutStartTime", startTime.toString());
        localStorage.setItem("workoutInProgress", "true");
        setDuration(0);

        workoutApi
          .save({
            exercises: [],
            supersetGroups: [],
            duration: 0,
            startTime,
          })
          .catch((err) =>
            console.error("Error creating empty workout:", err)
          );
      }
    }
  };



  // Save workout to API
  const saveWorkout = async () => {
    try {
      const supersetGroupsArray = supersetGroups.map((group) => Array.from(group));
      const startTime = localStorage.getItem("workoutStartTime");

      // Prepare exercises with sets, ensuring at least 1 default set per exercise
      const exercisesWithSets = workoutExercises.map((exercise) => {
        const setsForExercise = exerciseSets[exercise._id];
        const defaultSet = [{
          setNumber: 1,
          previous: "-",
          kg: 0,
          reps: 0,
          completed: false,
        }];

        return {
          ...exercise,
          sets: setsForExercise && setsForExercise.length > 0
            ? setsForExercise
            : defaultSet,

          // 🔹 pass restTimerSeconds to backend
          restTimerSeconds: (exercise as any).restTimerSeconds ?? 0,
        };
      });

      emitUpdate({
        draftWorkoutId: sessionStorage.getItem("draftWorkoutId"),
        exercises: exercisesWithSets,
        supersetGroups: supersetGroupsArray,
        duration
      });


      await workoutApi.save({
        exercises: exercisesWithSets,
        supersetGroups: supersetGroupsArray,
        duration: duration,
        startTime: startTime ? parseInt(startTime, 10) : undefined,
      });
    } catch (error) {
      console.error("Error saving workout:", error);
    }
  };

  // Auto-save workout when navigating away or component unmounts
  useEffect(() => {
    return () => {
      // Don't save if workout is being finished or already finished
      if (isFinishingRef.current) {
        return;
      }

      // Check if workout is still in progress
      const workoutInProgress = localStorage.getItem("workoutInProgress") === "true";
      if (!workoutInProgress) {
        return; // Don't save if workout is not in progress
      }

      // Save workout when navigating away (only if there are exercises)
      // Use current state values from closure
      const currentExercises = workoutExercises;
      if (currentExercises.length > 0) {
        // Create a save function with current state
        const supersetGroupsArray = supersetGroups.map((group) => Array.from(group));
        const startTime = localStorage.getItem("workoutStartTime");
        const currentDuration = duration;

        const exercisesWithSets = currentExercises.map((exercise) => {
          const sets = exerciseSets[exercise._id];
          const defaultSet = [{
            setNumber: 1,
            previous: "-",
            kg: 0,
            reps: 0,
            completed: false,
          }];
          return {
            ...exercise,
            sets: sets && sets.length > 0 ? sets : defaultSet,
            restTimerSeconds: (exercise as any).restTimerSeconds ?? 0,
          };
        });

        workoutApi.save({
          exercises: exercisesWithSets,
          supersetGroups: supersetGroupsArray,
          duration: currentDuration,
          startTime: startTime ? parseInt(startTime, 10) : undefined,
        }).catch(err => console.error("Error saving workout on unmount:", err));
      }
    };
  }, [workoutExercises, exerciseSets, supersetGroups, duration]); // Include dependencies so cleanup has latest values

  // Auto-save workout periodically and when exercises/sets change
  useEffect(() => {
    // Only save if there are exercises and workout is in progress
    const workoutInProgress = localStorage.getItem("workoutInProgress") === "true";
    if (workoutExercises.length > 0 && workoutInProgress) {
      // Debounce saves to avoid too many API calls
      const timeoutId = setTimeout(() => {
        saveWorkout().catch(err => console.error("Error auto-saving workout:", err));
      }, 1000); // Wait 1 second after changes before saving

      return () => clearTimeout(timeoutId);
    }
  }, [workoutExercises, exerciseSets, supersetGroups, duration]);

  // Check if an exercise is in a superset
  const isExerciseInSuperset = (exerciseId: string): boolean => {
    return supersetGroups.some((group) => group.has(exerciseId));
  };

  // Initialize workout timer and load exercises
  useEffect(() => {
    // Load workout from API
    loadWorkout();

    // Start timer interval - update every second
    intervalRef.current = setInterval(() => {
      const startTime = localStorage.getItem("workoutStartTime");
      if (startTime) {
        const elapsed = Math.floor(
          (Date.now() - parseInt(startTime, 10)) / 1000
        );
        setDuration(elapsed);
      }
    }, 1000);

    // Listen for custom event when exercises are updated in same tab
    const handleWorkoutExercisesUpdated = () => {
      console.log("workoutExercisesUpdated event received, reloading workout...");
      // Small delay to ensure backend has processed the save
      setTimeout(() => {
        loadWorkout();
      }, 100);
    };
    window.addEventListener(
      "workoutExercisesUpdated",
      handleWorkoutExercisesUpdated
    );

    // Also check for changes when page becomes visible (for same-tab navigation)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadWorkout();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup interval and listeners on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener(
        "workoutExercisesUpdated",
        handleWorkoutExercisesUpdated
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const draftWorkoutId = sessionStorage.getItem("draftWorkoutId");
    if (!draftWorkoutId) return;

    socket.connect();

    socket.emit("joinWorkout", {
      userId: "TEMP",
      draftWorkoutId
    });

    socket.on("workout:update", (data) => {
      setWorkoutExercises(data.exercises);
    });

    // 👇 Handle workout completed from any device
    socket.on("workout:complete", () => {
      console.log("🎉 Workout completed via socket");
      cleanupWorkoutState();
      router.push("/workout");
    });

    return () => {
      console.log("🔌 Leaving workout room");
      socket.off("workout:update");
      socket.off("workout:complete");
    };
  }, []);



  // Ensure all exercises have at least 1 default set
  useEffect(() => {
    const updatedSets = { ...exerciseSets };
    let hasChanges = false;

    workoutExercises.forEach((exercise) => {
      if (!updatedSets[exercise._id] || updatedSets[exercise._id].length === 0) {
        updatedSets[exercise._id] = [{
          setNumber: 1,
          previous: "-",
          kg: 0,
          reps: 0,
          completed: false,
        }];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setExerciseSets(updatedSets);
    }
  }, [workoutExercises]);

  // Reload workout when component becomes visible (for same-tab navigation)
  useEffect(() => {
    const handleFocus = () => {
      loadWorkout();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Save workout whenever exercises, sets, or superset groups change
  useEffect(() => {
    if (workoutExercises.length > 0) {
      // Debounce save to avoid too many API calls
      const timeoutId = setTimeout(() => {
        saveWorkout();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutExercises.length, exerciseSets, supersetGroups.length]);

  // Handle scroll to show/hide duration in header
  useEffect(() => {
    const handleWindowScroll = () => {
      const currentScrollY = window.scrollY;

      // Show duration when scrolling down past 50px, hide when scrolling up
      if (currentScrollY > 50 && currentScrollY > lastScrollY) {
        // Scrolling down
        setShowDurationInHeader(true);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
        // Scrolling up or at top
        setShowDurationInHeader(false);
      }

      setLastScrollY(currentScrollY);
    };

    const handleContainerScroll = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const currentScrollY = target.scrollTop;

      // Show duration when scrolling down past 50px, hide when scrolling up
      if (currentScrollY > 50 && currentScrollY > lastScrollY) {
        // Scrolling down
        setShowDurationInHeader(true);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
        // Scrolling up or at top
        setShowDurationInHeader(false);
      }

      setLastScrollY(currentScrollY);
    };

    // Listen to window scroll
    window.addEventListener("scroll", handleWindowScroll, { passive: true });

    // Also listen to scroll events on scrollable containers (for overflow-y-auto divs)
    // Query for containers each time to catch dynamically created ones
    const attachContainerListeners = () => {
      const scrollableContainers =
        document.querySelectorAll(".overflow-y-auto");
      scrollableContainers.forEach((container) => {
        container.addEventListener("scroll", handleContainerScroll, {
          passive: true,
        });
      });
      return scrollableContainers;
    };

    const scrollableContainers = attachContainerListeners();

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      scrollableContainers.forEach((container) => {
        container.removeEventListener("scroll", handleContainerScroll);
      });
    };
  }, [lastScrollY, workoutExercises.length]);

  const handleFinish = () => {
    // Check if there are no exercises added
    if (workoutExercises.length === 0) {
      setFinishModalMessage("Add an exercise");
      setShowFinishConfirmationModal(true);
      return;
    }

    // Check if exercises exist but have no set values (all sets have kg: 0 and reps: 0)
    const hasValidSets = workoutExercises.some((exercise) => {
      const sets = exerciseSets[exercise._id] || [];
      return sets.some((set) => set.kg > 0 || set.reps > 0);
    });

    if (!hasValidSets) {
      setFinishModalMessage("Your workout has no set values");
      setShowFinishConfirmationModal(true);
      return;
    }

    // If exercises exist and have valid sets, proceed with finishing workout
    finishWorkout();
  };

  const finishWorkout = async () => {
    try {
      isFinishingRef.current = true;

      // 1) finish workout ONCE
      const res = await workoutApi.finish(); // { success, data: Workout }
      const rawWorkout = res.data;

      // 2) get current user for username
      let username = "user";
      try {
        const me = await authApi.getMe();     // { success, data: User | null }
        const u = me.data;
        username =
          u?.name ||
          u?.firstName ||
          u?.email?.split("@")[0] ||
          "user";
      } catch (err) {
        console.warn("Could not fetch me(), using default username");
      }

      // 3) attach username for success page
      const workoutWithUser = {
        ...rawWorkout,
        user: { username },
      };

      sessionStorage.setItem(
        "lastFinishedWorkout",
        JSON.stringify(workoutWithUser)
      );

      // 4) clear timers + local state
      setDuration(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      localStorage.removeItem("workoutStartTime");
      localStorage.removeItem("workoutInProgress");
      setWorkoutExercises([]);
      setExerciseSets({});
      setSupersetGroups([]);

      cleanupWorkoutState();

      // 5) go to success page
      router.push("/workout/quick-start/finish-workout");
    } catch (error) {
      console.error("Error finishing workout:", error);
      isFinishingRef.current = false;
    }
  };



  const handleCancelFinish = () => {
    setShowFinishConfirmationModal(false);
  };

  const handleAddExercise = () => {
    router.push("/workout/quick-start/add-exercise");
    // Add exercise selection logic here
  };

  const handleSettings = () => {
    console.log("Settings clicked");
    // Add settings logic here
  };

  const handleDiscardClick = () => {
    setShowDiscardDialog(true);
  };

  const handleDiscardConfirm = () => {
    // Reset duration to 0
    setDuration(0);

    // Clear timer interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clear all local state
    setWorkoutExercises([]);
    setExerciseSets({});
    setSupersetGroups([]);

    // Navigate back to workout page
    router.push("/workout");
  };

  const handleDurationClick = () => {
    console.log("Duration clicked");
    // Add duration logic here
  };

  const handleVolumeClick = () => {
    console.log("Volume clicked");
    // Add volume logic here
  };

  const handleSetsClick = () => {
    console.log("Sets clicked");
    // Add sets logic here
  };

  const handleTimerIconClick = () => {
    setShowTimerModal(true);
  };

  // Calculate workout progress based on completed sets
  const calculateWorkoutProgress = () => {
    if (workoutExercises.length === 0) return 0;

    let totalSets = 0;
    let completedSets = 0;

    workoutExercises.forEach((exercise) => {
      const sets = exerciseSets[exercise._id] || [];
      totalSets += sets.length;
      completedSets += sets.filter((set) => set.completed).length;
    });

    if (totalSets === 0) return 0;
    return (completedSets / totalSets) * 100;
  };

  const workoutProgress = calculateWorkoutProgress();

  // ⛳️ Add this helper near top (BEFORE return)

  const cleanupWorkoutState = () => {
    console.log("🧹 Cleaning workout state + socket");

    sessionStorage.removeItem("draftWorkoutId");
    localStorage.removeItem("workoutInProgress");
    localStorage.removeItem("workoutStartTime");

    socket.off("workout:update");
    socket.off("workout:complete");

    try {
      socket.disconnect();
    } catch (e) {
      console.warn("socket disconnect ignored");
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border relative">
        <div className="flex items-center justify-between h-14 px-2">
          {/* Left: Back Button */}
          <div className="flex items-center gap-2 flex-row">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/workout")}
              className="h-10 w-10"
              aria-label="Go back"
            >
              <ChevronDown className="size-[20px]" />
            </Button>

            {/* Center: Title */}
            <h1 className="text-sm font-regular">
              {showDurationInHeader ? (
                <span className="text-blue-500">
                  {formatDuration(duration)}
                </span>
              ) : (
                "Log Workout"
              )}
            </h1>
          </div>

          {/* Right: Clock and Finish Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTimerIconClick}
              className="p-1 hover:opacity-80 transition-opacity"
              aria-label="Open timer"
            >
              <AlarmClock className="size-[20px] text-muted-foreground" />
            </button>
            <Button
              variant="default"
              onClick={handleFinish}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 h-8 text-sm"
            >
              Finish
            </Button>
          </div>
        </div>
        {/* Progress Bar */}
        {workoutExercises.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${workoutProgress}%` }}
            />
          </div>
        )}
      </header>

      {/* Workout Summary Metrics */}
      <div className="grid grid-cols-3 gap-4 px-6 py-6 ">
        <button
          onClick={handleDurationClick}
          className="text-left cursor-pointer hover:opacity-80 transition-opacity active:opacity-70"
        >
          <p className="text-sm text-muted-foreground mb-1">Duration</p>
          <p className="text-sm font-bold text-blue-500">
            {formatDuration(duration)}
          </p>
        </button>
        <button
          onClick={handleVolumeClick}
          className="text-left cursor-pointer hover:opacity-80 transition-opacity active:opacity-70"
        >
          <p className="text-sm text-muted-foreground mb-1">Volume</p>
          <p className="text-sm font-regular">{totalVolume} kg</p>
        </button>
        <button
          onClick={handleSetsClick}
          className="text-left cursor-pointer hover:opacity-80 transition-opacity active:opacity-70"
        >
          <p className="text-sm text-muted-foreground mb-1">Sets</p>
          <p className="text-sm font-regular">{totalSets}</p>
        </button>
      </div>

      {/* Main Content Area - Get Started or Exercise List */}
      {workoutExercises.length === 0 ? (
        <>
          <div className="flex flex flex-col items-center justify-center px-4 pt-12 pb-2">
            <Dumbbell className="size-[30px] text-gray-300 mb-6 stroke-[1.5]" />
            <h2 className="text-lg font-bold mb-2">Get started</h2>
            <p className="text-muted-foreground text-sm text-center">
              Add an exercise to start your workout
            </p>
          </div>

          {/* Bottom Action Buttons - Show when no exercises */}
          <div className="p-4 space-y-5">
            {/* Primary Button */}
            <Button
              variant="default"
              onClick={handleAddExercise}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-6 rounded-[10px]"
            >
              <Plus className="size-[18px] mr-2" />
              Add Exercise
            </Button>

            {/* Secondary Buttons */}
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={handleSettings}
                className="flex-1 text-sm py-4 bg-gray-100 text-black rounded-[10px] "
              >
                Settings
              </Button>
              <Button
                variant="default"
                onClick={handleDiscardClick}
                className="flex-1 text-sm py-4 bg-gray-100 text-red-500 rounded-[10px] "
              >
                Discard Workout
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="space-y-4">
            {workoutExercises.map((exercise, index) => {
              const isRemoving = removingExerciseIds.has(exercise._id);
              // Find if any exercise before this one is being removed
              const hasRemovingBefore = workoutExercises
                .slice(0, index)
                .some((ex) => removingExerciseIds.has(ex._id));

              // Ensure exercise has at least 1 default set
              const defaultSet = [{
                setNumber: 1,
                previous: "-",
                kg: 0,
                reps: 0,
                completed: false,
              }];

              return (
                <WorkoutExerciseCard
                  key={exercise._id}
                  exercise={exercise}
                  sets={exerciseSets[exercise._id] || defaultSet}
                  onSetsChange={(sets) => {
                    setExerciseSets((prev) => ({
                      ...prev,
                      [exercise._id]: sets,
                    }));
                  }}
                  onMenuClick={() => setSelectedExerciseForMenu(exercise)}
                  isInSuperset={isExerciseInSuperset(exercise._id)}
                  isRemoving={isRemoving}
                  shouldSlideUp={hasRemovingBefore}

                  restTimerSeconds={(exercise as any).restTimerSeconds ?? 0}
                  onRestTimerClick={() => {
                    const currentSeconds = (exercise as any).restTimerSeconds ?? 0;
                    setRestTimerModalExercise(exercise);
                    setRestTimerModalSeconds(currentSeconds);
                  }}
                  onSetCompleted={() => {
                    const seconds = (exercise as any).restTimerSeconds ?? 0;
                    if (seconds > 0) {
                      startRestTimer(exercise._id, exercise.name, seconds);
                    }
                  }}
                />
              );
            })}
          </div>

          {/* Bottom Action Buttons - Show below exercise cards */}
          <div className="p-2 pt-2 space-y-4 pb-4">
            {/* Primary Button */}
            <Button
              variant="default"
              onClick={handleAddExercise}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-6 rounded-[10px]"
            >
              <Plus className="size-[18px] mr-2" />
              Add Exercise
            </Button>

            {/* Secondary Buttons */}
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={handleSettings}
                className="flex-1 text-sm py-4 bg-gray-100 text-black rounded-[10px] "
              >
                Settings
              </Button>
              <Button
                variant="default"
                onClick={handleDiscardClick}
                className="flex-1 text-sm py-4 bg-gray-100 text-red-500 rounded-[10px] "
              >
                Discard Workout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Workout Modal */}
      <DiscardWorkoutModal
        open={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={handleDiscardConfirm}
      />

      {/* Timer Modal */}
      <TimerModal
        open={showTimerModal}
        onClose={() => setShowTimerModal(false)}
      />

      {/* Finish Workout Confirmation Modal */}
      <FinishWorkoutConfirmationModal
        open={showFinishConfirmationModal}
        onClose={handleCancelFinish}
        message={finishModalMessage}
      />

      {/* Exercise Options Modal */}
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
          router.push("/workout/quick-start/reorder-exercises");
        }}
        onReplace={() => {
          if (selectedExerciseForMenu) {
            // Store the exercise ID to replace in sessionStorage
            sessionStorage.setItem(
              "replaceExerciseId",
              selectedExerciseForMenu._id
            );
            setSelectedExerciseForMenu(null);
            router.push("/workout/quick-start/add-exercise?mode=replace");
          }
        }}
        onAddToSuperset={() => {
          // Keep the selected exercise and open superset modal
          // The ExerciseOptionsModal will close automatically due to showSupersetModal being true
          setShowSupersetModal(true);
        }}
        onRemoveFromSuperset={() => {
          if (selectedExerciseForMenu) {
            // Remove the entire superset group that contains this exercise
            // This removes badges from all exercises in that superset
            setSupersetGroups((prev) => {
              const updatedGroups = prev.filter(
                (group) => !group.has(selectedExerciseForMenu._id)
              );
              return updatedGroups;
            });
          }
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
              setSupersetGroups((prev) => {
                const newGroups = prev
                  .map((group) => {
                    const newGroup = new Set(group);
                    newGroup.delete(exerciseId);
                    return newGroup;
                  })
                  .filter((group) => group.size > 0);
                return newGroups;
              });
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

      {/* Add To Superset Modal */}
      <AddToSupersetModal
        open={showSupersetModal}
        onClose={() => {
          setShowSupersetModal(false);
          setSelectedExerciseForMenu(null);
        }}
        exercises={workoutExercises}
        currentExercise={selectedExerciseForMenu}
        onConfirm={(selectedExerciseIds) => {
          // Create a new superset group with the selected exercises
          const newGroup = new Set(selectedExerciseIds);

          // Remove exercises from existing groups if they're being added to a new group
          setSupersetGroups((prev) => {
            // First, remove all selected exercises from existing groups
            const updatedGroups = prev
              .map((group) => {
                const updatedGroup = new Set(group);
                selectedExerciseIds.forEach((id) => {
                  updatedGroup.delete(id);
                });
                return updatedGroup;
              })
              .filter((group) => group.size > 0);

            // Add the new group (only if it has more than one exercise)
            if (newGroup.size > 1) {
              updatedGroups.push(newGroup);
            }

            // Save will happen automatically via useEffect
            return updatedGroups;
          });
        }}
      />

      {restTimerModalExercise && (
        <RestTimerModal
          open={true}
          exerciseName={restTimerModalExercise.name}
          currentSeconds={restTimerModalSeconds}
          onSelect={(seconds) => {
            setRestTimerModalSeconds(seconds);

            // update restTimerSeconds on the selected exercise
            setWorkoutExercises((prev) =>
              prev.map((ex) =>
                ex._id === restTimerModalExercise._id
                  ? ({ ...ex, restTimerSeconds: seconds } as Exercise & {
                    restTimerSeconds?: number;
                  })
                  : ex
              )
            );
          }}
          onClose={() => setRestTimerModalExercise(null)}
        />
      )}

      {activeRest && (

        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-5">
          {/* ✅ TOP PROGRESS BAR — FULL WIDTH */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{
                width: `${activeRest.total > 0
                  ? Math.min(
                    100,
                    Math.max(0, (activeRest.remaining / activeRest.total) * 100)
                  )
                  : 0
                  }%`,
              }}
            />

          </div>
          <Button
            variant="ghost"
            className="h-10 px-5 bg-gray-200 text-sm rounded-xl"
            onClick={() => adjustRestTime(-15)}
          >
            -15
          </Button>

          <div className="flex-1 flex flex-col items-center">
            <span className="text-2xl font-regular">
              {formatRestTime(activeRest.remaining)}
            </span>
          </div>

          <Button
            variant="ghost"
            className="h-10 px-5 bg-gray-200 text-sm rounded-xl"
            onClick={() => adjustRestTime(15)}
          >
            +15
          </Button>

          <Button
            variant="default"
            className="h-10 px-5 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm text-white"
            onClick={stopRestTimer}
          >
            Skip
          </Button>
        </div>
      )}


    </div>
  );
}
