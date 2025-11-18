"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { workoutApi } from "@/lib/api";

export default function FinishWorkoutPage() {
  const router = useRouter();
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the completed workout data if needed
    // For now, just show a success message
    setLoading(false);
  }, []);

  const handleBack = () => {
    router.push("/workout");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

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
              onClick={handleBack}
              className="h-10 w-10"
              aria-label="Go back"
            >
              <ChevronDown className="size-[24px]" />
            </Button>

            {/* Center: Title */}
            <h1 className="text-lg font-regular">Workout Complete</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Great job!</h2>
          <p className="text-muted-foreground">
            Your workout has been completed successfully.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 w-full max-w-md space-y-4">
          <Button
            variant="default"
            onClick={handleBack}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg py-6 rounded-[10px]"
          >
            Back to Workouts
          </Button>
        </div>
      </div>
    </div>
  );
}

