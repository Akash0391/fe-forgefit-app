"use client";

import { RotateCw, Plus, Notebook, Search, Play, X } from "lucide-react";
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
import { useState, useEffect } from "react";

export default function WorkoutPage() {
  const router = useRouter();
  const [workoutInProgress, setWorkoutInProgress] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  useEffect(() => {
    // Check if workout is in progress
    const inProgress = localStorage.getItem("workoutInProgress") === "true";
    setWorkoutInProgress(inProgress);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleStartEmptyWorkout = () => {
    router.push("/workout/quick-start");
  };

  const handleResumeWorkout = () => {
    router.push("/workout/quick-start");
  };

  const handleDiscardClick = () => {
    setShowDiscardDialog(true);
  };

  const handleConfirmDiscard = () => {
    // Clear workout in progress flag and start time to reset timer
    localStorage.removeItem("workoutInProgress");
    localStorage.removeItem("workoutStartTime");
    setWorkoutInProgress(false);
    setShowDiscardDialog(false);
  };

  const handleCancelDiscard = () => {
    setShowDiscardDialog(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Pro Badge */}
          <div className="flex items-center">
            <span className="px-2 py-0.2 text-lg rounded-full bg-yellow-500 text-gray-600">
              PRO
            </span>
          </div>

          {/* Middle: Workout Title */}
          <h1 className="text-lg font-semibold capitalize">workout</h1>

          {/* Right: Refresh Icon */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-10 w-10"
              aria-label="Refresh page"
            >
              <RotateCw className="size-[20px]" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6 pb-20 mt-8">
        {/* Quick Start Section */}
        <section>
          <h2 className="text-lg font-semibold mb-5">Quick Start</h2>
          <Button
            onClick={() => {
              handleStartEmptyWorkout();
            }}
            variant="outline"
            className="w-full justify-start text-lg bg-gray-100 rounded-[10px] p-8"
            size="lg"
          >
            <Plus className="size-[26px]" />{" "}
            <span className="font-regular">Start Empty Workout</span>
          </Button>
        </section>

        {/* Routines Section */}
        <section>
          <h2 className="text-lg font-semibold mb-5">Routines</h2>
          <div className="flex flex-row gap-2">
            <button
              onClick={() => {
                // Handle New Routines click
                router.push("/workout/new-routine");
              }}
              className="w-1/2 flex flex-col items-center justify-center bg-gray-100 rounded-[10px] p-8 hover:bg-gray-200 transition-colors cursor-pointer active:scale-95"
            >
              <Notebook className="size-[20px] mb-2" />
              <p className="text-lg font-regular">New Routine</p>
            </button>
            <button
              onClick={() => {
                // Handle Explore routines click
                router.push("/workout/explore-routines");
              }}
              className="w-1/2 flex flex-col items-center justify-center bg-gray-100 rounded-[10px] p-8 hover:bg-gray-200 transition-colors cursor-pointer active:scale-95"
            >
              <Search className="size-[20px] mb-2" />
              <p className="text-lg font-regular">Explore routines</p>
            </button>
          </div>
        </section>

        {/* Workout on Progress */}
        {workoutInProgress && (
          <div className="fixed bottom-20 left-0 right-0 px-4 md:hidden border-t border-gray-200 pt-3">
            <div className="w-full bg-white rounded-[10px] px-4">
              <p className="text-lg font-regular text-muted-foreground text-center">Workout in Progress</p>
              <div className="flex gap-3">
                <Button
                  variant="default"
                  className="flex-1 text-lg bg-white hover:bg-blue-600 text-blue-500 rounded-[10px]"
                  onClick={handleResumeWorkout}
                >
                  <Play className="size-[16px] mr-2" />
                  Resume
                </Button>
                <Button
                  variant="default"
                  className="flex-1 text-lg bg-white text-red-500 hover:bg-gray-200 rounded-[10px]"
                  onClick={handleDiscardClick}
                >
                  <X className="size-[16px] mr-2" />
                  Discard
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discard Confirmation Dialog */}
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="sr-only">Discard Workout</DialogTitle>
            <DialogDescription className="text-center text-lg font-regular">
              Are you sure you want to discard this workout in progress?
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
