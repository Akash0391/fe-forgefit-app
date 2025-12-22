"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";

const TIMER_SOUNDS = [
  "Default",
  "Alarm",
  "Futuristic",
  "Ting Ting",
  "Boxing Bell",
];

export default function SelectTimerSoundPage() {
  const router = useRouter();
  const [selectedSound, setSelectedSound] = useState<string>("Default");

  useEffect(() => {
    // Load saved timer sound from localStorage
    const savedSound = localStorage.getItem("timerSound");
    if (savedSound) {
      setSelectedSound(savedSound);
    }
  }, []);

  const handleSelectSound = (sound: string) => {
    // Save to localStorage
    localStorage.setItem("timerSound", sound);
    setSelectedSound(sound);
  };

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
            Timer Sound
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="pb-4">
        {TIMER_SOUNDS.map((sound, index) => (
          <button
            key={sound}
            onClick={() => handleSelectSound(sound)}
            className="w-full flex items-center justify-between px-4 py-6 hover:bg-gray-50 transition-colors border-b-[0.5px] border-border last:border-b-0"
          >
            <span className="text-lg font-regular text-black">{sound}</span>
            {selectedSound === sound && (
              <Check className="size-7 text-blue-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

