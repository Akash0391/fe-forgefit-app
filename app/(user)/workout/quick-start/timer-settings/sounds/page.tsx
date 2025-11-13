"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";

export default function SoundsPage() {
  const router = useRouter();
  const [timerSound, setTimerSound] = useState("Default");
  const [timerVolume, setTimerVolume] = useState("High");
  const [checkSetVolume, setCheckSetVolume] = useState("High");
  const [livePRVolume, setLivePRVolume] = useState("High");

  useEffect(() => {
    // Load saved settings from localStorage
    const loadSettings = () => {
      const savedSound = localStorage.getItem("timerSound");
      if (savedSound) {
        setTimerSound(savedSound);
      }
      
      const savedTimerVolume = localStorage.getItem("timerVolume");
      if (savedTimerVolume) {
        setTimerVolume(savedTimerVolume);
      }
    };

    loadSettings();

    // Reload when page becomes visible (when returning from selection page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadSettings();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b-[0.5px] border-border">
        <div className="relative flex items-center justify-end h-16 px-4">

          {/* Left: Back button */}
          <button
            onClick={() => router.back()}
            className="absolute left-4 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="size-5 text-gray-600" />
          </button>
          {/* Center: Title - absolutely positioned */}
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-regular">
            Sounds
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-4">
        {/* Sound Type Category */}
        <div className="mb-6">
          <h2 className="text-lg font-regular text-gray-400 mb-5 mt-2 px-4">Sound Type</h2>
          <button
            onClick={() => {
              router.push("/workout/quick-start/timer-settings/sounds/select-timer-sound");
            }}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg font-regular text-black">Timer Sound</span>
            <div className="flex items-center gap-2">
              <span className="text-lg text-gray-500">{timerSound}</span>
              <ChevronRight className="size-5 text-gray-400" />
            </div>
          </button>
        </div>

        {/* Sounds Volume Category */}
        <div>
          <h2 className="text-lg font-regular text-gray-400 mb-5 mt-2 px-4">Sounds Volume</h2>
          <button
            onClick={() => {
              router.push("/workout/quick-start/timer-settings/sounds/select-timer-volume");
            }}
            className="w-full flex items-center justify-between px-4 py-6 hover:bg-gray-50 transition-colors border-b-[0.5px] border-border"
          >
            <span className="text-lg font-regular text-black">Timer Volume</span>
            <div className="flex items-center gap-2">
              <span className="text-lg text-gray-500">{timerVolume}</span>
              <ChevronRight className="size-5 text-gray-400" />
            </div>
          </button>
          
          <button
            onClick={() => {
              // Navigate to check set volume selection
              console.log("Select check set volume");
            }}
            className="w-full flex items-center justify-between px-4 py-6 hover:bg-gray-50 transition-colors border-b-[0.5px] border-border"
          >
            <span className="text-lg font-regular text-black">Check Set</span>
            <div className="flex items-center gap-2">
              <span className="text-lg text-gray-500">{checkSetVolume}</span>
              <ChevronRight className="size-5 text-gray-400" />
            </div>
          </button>
          
          <button
            onClick={() => {
              // Navigate to live PR volume selection
              console.log("Select live PR volume");
            }}
            className="w-full flex items-center justify-between px-4 py-6 hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg font-regular text-black">Live Personal Record Volume</span>
            <div className="flex items-center gap-2">
              <span className="text-lg text-gray-500">{livePRVolume}</span>
              <ChevronRight className="size-5 text-gray-400" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}