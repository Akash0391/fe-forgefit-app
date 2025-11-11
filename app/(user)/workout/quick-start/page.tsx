"use client";

import { AlarmClock, ChevronDown, Dumbbell, Plus } from "lucide-react";
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

export default function QuickStartPage() {
  const router = useRouter();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [duration, setDuration] = useState(0); // Duration in seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Initialize workout timer
  useEffect(() => {
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

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleFinish = () => {
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
    
    // Clear workout in progress flag and start time
    localStorage.removeItem("workoutInProgress");
    localStorage.removeItem("workoutStartTime");
    
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
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
            <h1 className="text-lg font-regular">Log Workout</h1>
          </div>

          {/* Right: Clock and Finish Button */}
          <div className="flex items-center gap-4">
            <AlarmClock className="size-[24px] text-muted-foreground" />
            <Button
              variant="default"
              onClick={handleFinish}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 h-9"
            >
              Finish
            </Button>
          </div>
        </div>
      </header>

      {/* Workout Summary Metrics */}
      <div className="grid grid-cols-3 gap-4 px-4 py-6 ">
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

      {/* Main Content Area - Get Started */}
      <div className="flex flex flex-col items-center justify-center px-4 pt-12 pb-2">
        <Dumbbell className="size-[36px] text-gray-300 mb-6 stroke-[1.5]" />
        <h2 className="text-xl font-bold mb-2">Get started</h2>
        <p className="text-muted-foreground text-xm text-center">
          Add an exercise to start your workout
        </p>
      </div>

      {/* Bottom Action Buttons */}
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
    </div>
  );
}
