"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TimerSettingsPage() {
  const router = useRouter();

  // Settings state
  const [defaultTimerDuration, setDefaultTimerDuration] = useState(60); // in seconds
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [autoStart, setAutoStart] = useState(false);

  const handleDefaultDurationChange = (seconds: number) => {
    if (seconds >= 15 && seconds <= 3600) {
      setDefaultTimerDuration(seconds);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) {
      return `${secs}s`;
    }
    return `${mins}m ${secs > 0 ? `${secs}s` : ""}`;
  };

  const handleSoundsClick = () => {
    router.push("/workout/quick-start/timer-settings/sounds");
  };

  const handleDone = () => {
    // Save settings to localStorage or API
    // For now, just navigate back
    router.back();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b-[0.5px] border-border">
        <div className="relative flex items-center justify-end h-16 px-4">
          {/* Center: Title - absolutely positioned */}
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-regular">
            Timer Settings
          </h1>

          {/* Right: Save button */}
          <Button
            variant="ghost"
            onClick={handleDone}
            className="text-blue-500 hover:text-blue-600 text-lg font-regular px-4 py-2 h-9 -mr-2"
          >
            Done
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-1 py-6">
        <div className="space-y-4 border-b-[1px] border-border pb-5">
          <div
          onClick={handleSoundsClick} className="flex items-center justify-between px-4">
            <Button
              variant="ghost"
              className="text-black text-lg font-regular px-0 py-2 h-9"
            >
              Sounds
            </Button>
            <ChevronRight className="size-5 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
