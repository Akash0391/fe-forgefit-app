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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Exercise, workoutApi, SetData as ApiSetData } from "@/lib/api";
import { Input } from "@/components/ui/input";
import TimerModal from "@/components/TimerModal";
import FinishWorkoutConfirmationModal from "@/components/FinishWorkoutConfirmationModal";
import ExerciseOptionsModal from "@/components/ExerciseOptionsModal";
import AddToSupersetModal from "@/components/AddToSupersetModal";

interface SetData {
  setNumber: number;
  previous: string;
  kg: number;
  reps: number;
  completed: boolean;
}

interface ExerciseSets {
  [exerciseId: string]: SetData[];
}

export default function QuickStartPage() {
  const router = useRouter();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [duration, setDuration] = useState(0); // Duration in seconds
  const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>([]);
  const [showDurationInHeader, setShowDurationInHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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

  // Load workout from API
  const loadWorkout = async () => {
    try {
      const response = await workoutApi.getActive();
      if (response.data) {
        const workout = response.data;
        
        // Extract exercises
        const exercises = workout.exercises.map((ex) => {
          const exercise = typeof ex.exerciseId === 'object' ? ex.exerciseId : { _id: ex.exerciseId };
          return exercise as Exercise;
        });
        setWorkoutExercises(exercises);
        
        // Extract sets
        const sets: ExerciseSets = {};
        workout.exercises.forEach((ex) => {
          const exerciseId = typeof ex.exerciseId === 'object' ? ex.exerciseId._id : ex.exerciseId;
          // Ensure at least 1 default set is shown
          if (!ex.sets || ex.sets.length === 0) {
            sets[exerciseId] = [{
              setNumber: 1,
              previous: "-",
              kg: 0,
              reps: 0,
              completed: false,
            }];
          } else {
            sets[exerciseId] = ex.sets;
          }
        });
        setExerciseSets(sets);
        
        // Extract superset groups
        const groups = workout.supersetGroups.map((group) => 
          new Set(group.exerciseIds.map((id: string | Exercise) => 
            typeof id === 'object' && id !== null && '_id' in id ? id._id : id as string
          ))
        );
        setSupersetGroups(groups);
        
        // Set duration and start time
        if (workout.startTime) {
          const startTime = new Date(workout.startTime).getTime();
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setDuration(elapsed);
          localStorage.setItem("workoutStartTime", startTime.toString());
        } else {
          // Initialize start time if not set
          const startTime = Date.now();
          localStorage.setItem("workoutStartTime", startTime.toString());
          setDuration(0);
          // Save workout with start time (don't call saveWorkout here to avoid loop)
          const supersetGroupsArray = groups.map((group) => Array.from(group));
          workoutApi.save({
            exercises: exercises,
            supersetGroups: supersetGroupsArray,
            duration: 0,
            startTime: startTime,
          }).catch(err => console.error("Error saving start time:", err));
        }
      } else {
        // No active workout - create one and start timer
        setWorkoutExercises([]);
        setExerciseSets({});
        setSupersetGroups([]);
        
        // Initialize start time and create empty workout
        const startTime = Date.now();
        localStorage.setItem("workoutStartTime", startTime.toString());
        setDuration(0);
        
        // Create empty workout on backend with start time
        workoutApi.save({
          exercises: [],
          supersetGroups: [],
          duration: 0,
          startTime: startTime,
        }).catch(err => console.error("Error creating empty workout:", err));
      }
    } catch (error) {
      console.error("Error loading workout:", error);
      setWorkoutExercises([]);
      setExerciseSets({});
      setSupersetGroups([]);
      
      // Even on error, start timer if not already started
      if (!localStorage.getItem("workoutStartTime")) {
        const startTime = Date.now();
        localStorage.setItem("workoutStartTime", startTime.toString());
        setDuration(0);
        
        // Try to create empty workout on backend
        workoutApi.save({
          exercises: [],
          supersetGroups: [],
          duration: 0,
          startTime: startTime,
        }).catch(err => console.error("Error creating empty workout:", err));
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
        const sets = exerciseSets[exercise._id];
        // Ensure at least 1 default set
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
        };
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
      await workoutApi.finish();
      
      // Reset duration to 0
      setDuration(0);

      // Clear timer interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Clear local state
      localStorage.removeItem("workoutStartTime");
      setWorkoutExercises([]);
      setExerciseSets({});
      setSupersetGroups([]);
    } catch (error) {
      console.error("Error finishing workout:", error);
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

  const handleConfirmDiscard = async () => {
    try {
      await workoutApi.discard();
      
      // Reset duration to 0
      setDuration(0);

      // Clear timer interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Clear local state
      localStorage.removeItem("workoutStartTime");
      setWorkoutExercises([]);
      setExerciseSets({});
      setSupersetGroups([]);
      setShowDiscardDialog(false);
      router.push("/workout");
    } catch (error) {
      console.error("Error discarding workout:", error);
    }
  };

  const handleCancelDiscard = () => {
    setShowDiscardDialog(false);
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border relative">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Back Button */}
          <div className="flex items-center gap-3 flex-row">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-10 w-10"
              aria-label="Go back"
            >
              <ChevronDown className="size-[24px]" />
            </Button>

            {/* Center: Title */}
            <h1 className="text-lg font-regular">
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
          <div className="flex items-center gap-4">
            <button
              onClick={handleTimerIconClick}
              className="p-1 hover:opacity-80 transition-opacity"
              aria-label="Open timer"
            >
              <AlarmClock className="size-[24px] text-muted-foreground" />
            </button>
            <Button
              variant="default"
              onClick={handleFinish}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 h-9"
            >
              Finish
            </Button>
          </div>
        </div>
        {/* Progress Bar */}
        {workoutExercises.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
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
          <p className="text-xl font-bold text-blue-500">
            {formatDuration(duration)}
          </p>
        </button>
        <button
          onClick={handleVolumeClick}
          className="text-left cursor-pointer hover:opacity-80 transition-opacity active:opacity-70"
        >
          <p className="text-sm text-muted-foreground mb-1">Volume</p>
          <p className="text-xl font-regular">0 kg</p>
        </button>
        <button
          onClick={handleSetsClick}
          className="text-left cursor-pointer hover:opacity-80 transition-opacity active:opacity-70"
        >
          <p className="text-sm text-muted-foreground mb-1">Sets</p>
          <p className="text-xl font-regular">0</p>
        </button>
      </div>

      {/* Main Content Area - Get Started or Exercise List */}
      {workoutExercises.length === 0 ? (
        <>
          <div className="flex flex flex-col items-center justify-center px-4 pt-12 pb-2">
            <Dumbbell className="size-[36px] text-gray-300 mb-6 stroke-[1.5]" />
            <h2 className="text-xl font-bold mb-2">Get started</h2>
            <p className="text-muted-foreground text-xm text-center">
              Add an exercise to start your workout
            </p>
          </div>

          {/* Bottom Action Buttons - Show when no exercises */}
          <div className="p-4 space-y-5">
            {/* Primary Button */}
            <Button
              variant="default"
              onClick={handleAddExercise}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg py-6 rounded-[10px]"
            >
              <Plus className="size-[20px] mr-2" />
              Add Exercise
            </Button>

            {/* Secondary Buttons */}
            <div className="flex gap-5">
              <Button
                variant="default"
                onClick={handleSettings}
                className="flex-1 text-lg py-6 bg-gray-100 text-black rounded-[10px] "
              >
                Settings
              </Button>
              <Button
                variant="default"
                onClick={handleDiscardClick}
                className="flex-1 text-lg py-6 bg-gray-100 text-red-500 rounded-[10px] "
              >
                Discard Workout
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4">
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
                />
              );
            })}
          </div>

          {/* Bottom Action Buttons - Show below exercise cards */}
          <div className="p-4 space-y-5 pb-6">
            {/* Primary Button */}
            <Button
              variant="default"
              onClick={handleAddExercise}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg py-6 rounded-[10px]"
            >
              <Plus className="size-[20px] mr-2" />
              Add Exercise
            </Button>

            {/* Secondary Buttons */}
            <div className="flex gap-5">
              <Button
                variant="default"
                onClick={handleSettings}
                className="flex-1 text-lg py-6 bg-gray-100 text-black rounded-[10px] "
              >
                Settings
              </Button>
              <Button
                variant="default"
                onClick={handleDiscardClick}
                className="flex-1 text-lg py-6 bg-gray-100 text-red-500 rounded-[10px] "
              >
                Discard Workout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Confirmation Dialog */}
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="sr-only">Discard Workout</DialogTitle>
            <DialogDescription className="text-center text-lg font-regular">
              Are you sure you want to discard this workout?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-5">
            <Button
              variant="default"
              onClick={handleConfirmDiscard}
              className="w-full sm:w-auto bg-gray-100 text-red-500 p-6 text-lg rounded-[10px]"
            >
              Discard Workout
            </Button>
            <Button
              variant="default"
              onClick={handleCancelDiscard}
              className="w-full sm:w-auto bg-gray-100 text-black p-6 text-lg rounded-[10px]"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}

// Workout Exercise Card Component
interface WorkoutExerciseCardProps {
  exercise: Exercise;
  sets: SetData[];
  onSetsChange: (sets: SetData[]) => void;
  onMenuClick: () => void;
  isInSuperset?: boolean;
  isRemoving?: boolean;
  shouldSlideUp?: boolean;
}

function WorkoutExerciseCard({
  exercise,
  sets,
  onSetsChange,
  onMenuClick,
  isInSuperset = false,
  isRemoving = false,
  shouldSlideUp = false,
}: WorkoutExerciseCardProps) {
  const [notes, setNotes] = useState("");
  const [restTimerEnabled, setRestTimerEnabled] = useState(false);

  const handleAddSet = () => {
    onSetsChange([
      ...sets,
      {
        setNumber: sets.length + 1,
        previous: "-",
        kg: 0,
        reps: 0,
        completed: false,
      },
    ]);
  };

  const handleSetChange = (
    index: number,
    field: string,
    value: string | number | boolean
  ) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    onSetsChange(newSets);
  };

  // Format exercise name with equipment in parentheses if available
  const formatExerciseName = () => {
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
    <div
      className={`p-2 overflow-hidden ${
        isRemoving
          ? "opacity-0 max-h-0 mb-0"
          : "opacity-100 max-h-[2000px]"
      }`}
      style={{
        transition: isRemoving
          ? "opacity 300ms ease-in-out, max-height 400ms ease-in-out, margin-bottom 400ms ease-in-out, transform 400ms ease-in-out"
          : "opacity 300ms ease-in-out, max-height 400ms ease-in-out, margin-top 400ms ease-in-out, transform 400ms ease-in-out",
        marginTop: shouldSlideUp ? "-4rem" : undefined,
        transform: shouldSlideUp ? "translateY(0)" : "none",
      }}
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
              {formatExerciseName()}
            </h3>
          </div>
        </div>

        {/* Options Menu */}
        <button
          onClick={onMenuClick}
          className="flex-shrink-0 hover:bg-gray-100 rounded-full transition-colors"
        >
          <MoreVertical className="size-7 text-gray-600" />
        </button>
      </div>
      {/* Exercise Name */}
      <div className="flex-1 flex-col min-w-0">
        {/* Superset Badge */}
        {isInSuperset && (
          <div className="bg-[#b600fd] text-white text-lg font-regular rounded-[8px] text-center py-0.5 px-5 inline-block">
            Superset
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="mb-4">
        <Input
          placeholder="Add notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full !border-none text-gray-500 placeholder:text-gray-400"
        />
      </div>

      {/* Rest Timer Section */}
      <div
        className="flex items-center gap-2 mb-5 mt-5 cursor-pointer hover:opacity-80 transition-opacity active:opacity-70"
        onClick={() => setRestTimerEnabled(!restTimerEnabled)}
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
        {sets.map((set, index) => (
          <div
            key={index}
            className={`grid grid-cols-5 gap-20 items-center py-2 border-b border-gray-100 last:border-b-0 rounded transition-colors ${
              set.completed ? "bg-green-100" : ""
            }`}
          >
            <div
              className={`text-lg font-semibold text-center ${
                set.completed ? "text-gray-600" : "text-gray-700"
              }`}
            >
              {set.setNumber}
            </div>
            <div
              className={`text-lg font-semibold text-center ${
                set.completed ? "text-gray-500" : "text-gray-500"
              }`}
            >
              {set.previous}
            </div>
            <div className="flex justify-center">
              <Input
                type="number"
                value={set.kg || ""}
                onChange={(e) =>
                  handleSetChange(index, "kg", parseInt(e.target.value) || 0)
                }
                className={`w-full h-8 px-2 text-sm text-center !border-0 border-none focus:!border-0 focus:border-none focus:ring-0 focus:outline-none shadow-none ${
                  set.completed ? "bg-green-100" : ""
                }`}
                placeholder="0"
              />
            </div>
            <div className="flex justify-center">
              <Input
                type="number"
                value={set.reps || ""}
                onChange={(e) =>
                  handleSetChange(index, "reps", parseInt(e.target.value) || 0)
                }
                className={`w-full h-8 px-2 text-sm text-center !border-0 border-none focus:!border-0 focus:border-none focus:ring-0 focus:outline-none shadow-none ${
                  set.completed ? "bg-green-100" : ""
                }`}
                placeholder="0"
              />
            </div>
            <div className="flex justify-center">
              <button
                onClick={() =>
                  handleSetChange(index, "completed", !set.completed)
                }
                className="cursor-pointer"
              >
                {set.completed ? (
                  <SquareCheck className="size-6 text-green-600" />
                ) : (
                  <SquareCheck className="size-6 text-gray-300" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Set Button */}
      <Button
        variant="ghost"
        onClick={handleAddSet}
        className="w-full  text-gray-700 bg-gray-100 py-2 h-auto"
      >
        <Plus className="size-6 mr-2" />
        <span className="text-lg font-regular">Add Set</span>
      </Button>
    </div>
  );
}
