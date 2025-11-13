"use client";

import { AlarmClock, ChevronDown, Dumbbell, Plus, MoreVertical, Clock, Check, Timer, CheckCheck, SquareCheck } from "lucide-react";
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
import { Exercise } from "@/lib/api";
import { Input } from "@/components/ui/input";
import TimerModal from "@/components/TimerModal";
import FinishWorkoutConfirmationModal from "@/components/FinishWorkoutConfirmationModal";

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
  const [showFinishConfirmationModal, setShowFinishConfirmationModal] = useState(false);
  const [finishModalMessage, setFinishModalMessage] = useState("Add an exercise");
  const [exerciseSets, setExerciseSets] = useState<ExerciseSets>({});

  // Format duration to display (e.g., "1m 23s", "45s", "1h 5m")
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    if (minutes > 0) {
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    }
    
    return `${seconds}s`;
  };

  // Load workout exercises from localStorage
  const loadWorkoutExercises = () => {
    const exercisesJson = localStorage.getItem("workoutExercises");
    if (exercisesJson) {
      try {
        const exercises = JSON.parse(exercisesJson);
        setWorkoutExercises(exercises);
        // Initialize sets for new exercises
        setExerciseSets(prev => {
          const newSets = { ...prev };
          exercises.forEach((exercise: Exercise) => {
            if (!newSets[exercise._id]) {
              newSets[exercise._id] = [{ setNumber: 1, previous: "-", kg: 0, reps: 0, completed: false }];
            }
          });
          return newSets;
        });
      } catch (error) {
        console.error("Error parsing workout exercises:", error);
        setWorkoutExercises([]);
      }
    } else {
      setWorkoutExercises([]);
    }
  };

  // Initialize workout timer and load exercises
  useEffect(() => {
    // Load exercises from localStorage
    loadWorkoutExercises();

    // Check if workout start time exists in localStorage
    const workoutStartTime = localStorage.getItem("workoutStartTime");
    
    if (workoutStartTime) {
      // Calculate elapsed time from stored start time
      const startTime = parseInt(workoutStartTime, 10);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setDuration(elapsed);
    } else {
      // First time starting workout - store current time
      localStorage.setItem("workoutStartTime", Date.now().toString());
      setDuration(0);
    }

    // Set workout in progress flag
    localStorage.setItem("workoutInProgress", "true");

    // Start timer interval - update every second
    intervalRef.current = setInterval(() => {
      const startTime = localStorage.getItem("workoutStartTime");
      if (startTime) {
        const elapsed = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
        setDuration(elapsed);
      }
    }, 1000);

    // Listen for storage changes (when exercises are added from add-exercise page in different tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "workoutExercises") {
        loadWorkoutExercises();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom event when exercises are updated in same tab
    const handleWorkoutExercisesUpdated = () => {
      loadWorkoutExercises();
    };
    window.addEventListener("workoutExercisesUpdated", handleWorkoutExercisesUpdated);

    // Also check for changes when page becomes visible (for same-tab navigation)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadWorkoutExercises();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup interval and listeners on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("workoutExercisesUpdated", handleWorkoutExercisesUpdated);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Reload exercises when component becomes visible (for same-tab navigation)
  useEffect(() => {
    const handleFocus = () => {
      loadWorkoutExercises();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

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
      const scrollableContainers = document.querySelectorAll('.overflow-y-auto');
      scrollableContainers.forEach(container => {
        container.addEventListener("scroll", handleContainerScroll, { passive: true });
      });
      return scrollableContainers;
    };

    const scrollableContainers = attachContainerListeners();

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      scrollableContainers.forEach(container => {
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
    const hasValidSets = workoutExercises.some(exercise => {
      const sets = exerciseSets[exercise._id] || [];
      return sets.some(set => set.kg > 0 || set.reps > 0);
    });
    
    if (!hasValidSets) {
      setFinishModalMessage("Your workout has no set values");
      setShowFinishConfirmationModal(true);
      return;
    }
    
    // If exercises exist and have valid sets, proceed with finishing workout
    finishWorkout();
  };

  const finishWorkout = () => {
    console.log("Finish workout");
    // Reset duration to 0
    setDuration(0);
    
    // Clear timer interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Clear workout in progress flag and start time when finished
    localStorage.removeItem("workoutInProgress");
    localStorage.removeItem("workoutStartTime");
    // Add finish workout logic here
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

  const handleConfirmDiscard = () => {
    console.log("Discard Workout clicked");
    // Reset duration to 0
    setDuration(0);
    
    // Clear timer interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Clear workout in progress flag, start time, and exercises
    localStorage.removeItem("workoutInProgress");
    localStorage.removeItem("workoutStartTime");
    localStorage.removeItem("workoutExercises");
    
    setWorkoutExercises([]);
    setShowDiscardDialog(false);
    router.push("/workout");
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
    
    workoutExercises.forEach(exercise => {
      const sets = exerciseSets[exercise._id] || [];
      totalSets += sets.length;
      completedSets += sets.filter(set => set.completed).length;
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
              {showDurationInHeader ? <span className="text-blue-500">{formatDuration(duration)}</span> : "Log Workout"}
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
          <p className="text-xl font-bold text-blue-500">{formatDuration(duration)}</p>
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
            {workoutExercises.map((exercise) => (
              <WorkoutExerciseCard 
                key={exercise._id} 
                exercise={exercise}
                sets={exerciseSets[exercise._id] || [{ setNumber: 1, previous: "-", kg: 0, reps: 0, completed: false }]}
                onSetsChange={(sets) => {
                  setExerciseSets(prev => ({
                    ...prev,
                    [exercise._id]: sets
                  }));
                }}
              />
            ))}
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
      <TimerModal open={showTimerModal} onClose={() => setShowTimerModal(false)} />

      {/* Finish Workout Confirmation Modal */}
      <FinishWorkoutConfirmationModal
        open={showFinishConfirmationModal}
        onClose={handleCancelFinish}
        message={finishModalMessage}
      />
    </div>
  );
}

// Workout Exercise Card Component
interface WorkoutExerciseCardProps {
  exercise: Exercise;
  sets: SetData[];
  onSetsChange: (sets: SetData[]) => void;
}

function WorkoutExerciseCard({ exercise, sets, onSetsChange }: WorkoutExerciseCardProps) {
  const [notes, setNotes] = useState("");
  const [restTimerEnabled, setRestTimerEnabled] = useState(false);

  const handleAddSet = () => {
    onSetsChange([...sets, { 
      setNumber: sets.length + 1, 
      previous: "-", 
      kg: 0, 
      reps: 0, 
      completed: false 
    }]);
  };

  const handleSetChange = (index: number, field: string, value: string | number | boolean) => {
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
    <div className="p-2">
      {/* Exercise Header */}
      <div className="flex items-center gap-3 mb-4">
        {/* Exercise Image/Icon */}
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
        
        {/* Exercise Name */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-blue-600 truncate">
            {formatExerciseName()}
          </h3>
        </div>

        {/* Options Menu */}
        <button className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreVertical className="size-5 text-gray-600" />
        </button>
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
        <span className="text-lg text-blue-600 font-regular">Rest Timer: OFF</span>
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
              set.completed ? 'bg-green-100' : ''
            }`}
          >
            <div className={`text-lg font-semibold text-center ${
              set.completed ? 'text-gray-600' : 'text-gray-700'
            }`}>
              {set.setNumber}
            </div>
            <div className={`text-lg font-semibold text-center ${
              set.completed ? 'text-gray-500' : 'text-gray-500'
            }`}>
              {set.previous}
            </div>
            <div className="flex justify-center">
              <Input
                type="number"
                value={set.kg || ""}
                onChange={(e) => handleSetChange(index, "kg", parseInt(e.target.value) || 0)}
                className={`w-full h-8 px-2 text-sm text-center !border-0 border-none focus:!border-0 focus:border-none focus:ring-0 focus:outline-none shadow-none ${
                  set.completed ? 'bg-green-100' : ''
                }`}
                placeholder="0"
              />
            </div>
            <div className="flex justify-center">
              <Input
                type="number"
                value={set.reps || ""}
                onChange={(e) => handleSetChange(index, "reps", parseInt(e.target.value) || 0)}
                className={`w-full h-8 px-2 text-sm text-center !border-0 border-none focus:!border-0 focus:border-none focus:ring-0 focus:outline-none shadow-none ${
                  set.completed ? 'bg-green-100' : ''
                }`}
                placeholder="0"
              />
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => handleSetChange(index, "completed", !set.completed)}
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
