"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";

const VOLUME_OPTIONS = [
  "High",
  "Normal",
  "Low",
  "Off",
];

export default function SelectPRVolumePage() {
  const router = useRouter();
  const [selectedVolume, setSelectedVolume] = useState<string>("High");

  useEffect(() => {
    // Load saved timer volume from localStorage
    const savedVolume = localStorage.getItem("prVolume");
    if (savedVolume) {
      setSelectedVolume(savedVolume);
    }
  }, []);

  const handleSelectVolume = (volume: string) => {
    // Save to localStorage
        localStorage.setItem("prVolume", volume);
    setSelectedVolume(volume);
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
            Live Personal Record Volume
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="pb-4">
        {VOLUME_OPTIONS.map((volume, index) => (
          <button
            key={volume}
            onClick={() => handleSelectVolume(volume)}
            className="w-full flex items-center justify-between px-4 py-6 hover:bg-gray-50 transition-colors border-b-[0.5px] border-border last:border-b-0"
          >
            <span className="text-lg font-regular text-black">{volume}</span>
            {selectedVolume === volume && (
              <Check className="size-7 text-blue-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

