"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TimerModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TimerModal({ open, onClose }: TimerModalProps) {
  const [timerMode, setTimerMode] = useState<"timer" | "stopwatch">("timer");
  const [timerValue, setTimerValue] = useState(60); // Timer value in seconds (default 1 minute)
  const [initialTimerValue, setInitialTimerValue] = useState(60); // Initial timer value when started
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0); // For stopwatch
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleTimerDecrease = () => {
    if (timerValue > 15) {
      const newValue = timerValue - 15;
      setTimerValue(newValue);
      if (!timerRunning) {
        setInitialTimerValue(newValue);
      }
    }
  };

  const handleTimerIncrease = () => {
    const newValue = timerValue + 15;
    setTimerValue(newValue);
    if (!timerRunning) {
      setInitialTimerValue(newValue);
    }
  };

  const formatTimerDisplay = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStartTimer = () => {
    if (timerMode === "timer") {
      setInitialTimerValue(timerValue); // Store the initial value
      setTimerRunning(true);
      timerIntervalRef.current = setInterval(() => {
        setTimerValue((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Stopwatch mode
      setTimerRunning(true);
      timerIntervalRef.current = setInterval(() => {
        setTimerElapsed((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleStopTimer = () => {
    setTimerRunning(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    // Reset timer when canceling (only for timer mode)
    if (timerMode === "timer") {
      setTimerValue(initialTimerValue);
    }
    // For stopwatch, just stop - don't reset elapsed time
  };

  const handleResetTimer = useCallback(() => {
    setTimerRunning(false);
    setTimerValue(60);
    setInitialTimerValue(60);
    setTimerElapsed(0);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  }, []);

  const handleModeChange = (mode: "timer" | "stopwatch") => {
    setTimerMode(mode);
    handleResetTimer();
  };

  // Cleanup timer interval on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Reset timer when modal closes
  useEffect(() => {
    if (!open) {
      handleResetTimer();
    }
  }, [open, handleResetTimer]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      {/* Modal Content */}
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-[10px] shadow-lg w-[calc(100%-2rem)] max-w-lg animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2 pt-4 pb-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close timer"
          >
            <Settings2 className="size-7 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold">Clock</h2>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Tabs */}
        <div className="px-4 pb-6">
          <Tabs value={timerMode} onValueChange={(value) => handleModeChange(value as "timer" | "stopwatch")}>
            <TabsList className="w-full">
              <TabsTrigger value="timer">Timer</TabsTrigger>
              <TabsTrigger value="stopwatch">Stopwatch</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Timer Display */}
        <div className="flex items-center justify-center px-6 pb-8">
          {/* Decrease Button - Only show in Timer mode */}
          {timerMode === "timer" && (
            <button
              onClick={handleTimerDecrease}
              disabled={timerRunning}
              className="text-blue-500 font-medium text-lg px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -15s
            </button>
          )}

          {/* Circular Timer Display */}
          <div className={`relative flex items-center justify-center mt-4 mb-4 ${timerMode === "timer" ? "mx-8" : ""}`}>
            <div className="relative w-72 h-72 flex items-center justify-center">
              {/* Progress Ring SVG */}
              <svg
                className="absolute inset-0 w-full h-full transform -rotate-90"
                viewBox="0 0 288 288"
              >
                {/* Background circle */}
                <circle
                  cx="144"
                  cy="144"
                  r="138"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                {/* Progress circle - Timer mode */}
                {timerMode === "timer" && initialTimerValue > 0 && (
                  <circle
                    cx="144"
                    cy="144"
                    r="138"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 138}
                    strokeDashoffset={
                      2 * Math.PI * 138 * (1 - timerValue / initialTimerValue)
                    }
                    className="transition-all duration-1000 ease-linear"
                    
                  />
                )}
                {/* Progress circle - Stopwatch mode */}
                {timerMode === "stopwatch" && (
                  <circle
                    cx="144"
                    cy="144"
                    r="138"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 138}
                    strokeDashoffset={
                      timerRunning
                        ? 2 * Math.PI * 138 * (1 - (timerElapsed % 60) / 60)
                        : 0
                    }
                    className="transition-all duration-1000 ease-linear"
                  />
                )}
              </svg>
              {/* Timer text */}
              <span className="text-6xl font-semibold relative z-10">
                {timerMode === "timer"
                  ? formatTimerDisplay(timerValue)
                  : formatTimerDisplay(timerElapsed)}
              </span>
            </div>
          </div>

          {/* Increase Button - Only show in Timer mode */}
          {timerMode === "timer" && (
            <button
              onClick={handleTimerIncrease}
              disabled={timerRunning}
              className="text-blue-500 font-medium text-lg px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +15s
            </button>
          )}
        </div>

        {/* Start/Stop Button */}
        <div className="px-6 pb-6">
          {timerMode === "timer" ? (
            // Timer mode buttons
            timerRunning ? (
              <div className="flex gap-3">
                <Button
                  onClick={handleStopTimer}   
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-black py-6 text-lg rounded-[10px]"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleStartTimer}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 text-lg rounded-[10px]"
              >
                Start
              </Button>
            )
          ) : (
            // Stopwatch mode buttons
            timerRunning ? (
              <Button
                onClick={handleStopTimer}
                className="w-full bg-gray-100 hover:bg-gray-200 text-black py-6 text-lg rounded-[10px]"
              >
                Stop
              </Button>
            ) : timerElapsed > 0 ? (
              <div className="flex gap-3">
                <Button
                  onClick={handleResetTimer}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-black py-6 text-lg rounded-[10px]"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleStartTimer}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-6 text-lg rounded-[10px]"
                >
                  Start
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleStartTimer}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 text-lg rounded-[10px]"
              >
                Start
              </Button>
            )
          )}
        </div>
      </div>
    </>
  );
}

