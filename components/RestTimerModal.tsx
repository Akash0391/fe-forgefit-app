"use client";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef } from "react";

interface RestTimerModalProps {
  open: boolean;
  exerciseName: string;
  currentSeconds: number;      // 0 = OFF
  onSelect: (seconds: number) => void;
  onClose: () => void;
}

// OFF + 5s steps up to 5 minutes (300s)
const DEFAULT_REST_OPTIONS: number[] = (() => {
  const arr: number[] = [0]; // 0 = OFF

  // 5s gap from 0 → 2 minutes (120s)
  for (let s = 5; s <= 120; s += 5) {
    arr.push(s);
  }

  // 15s gap from 2 minutes → 5 minutes (300s)
  for (let s = 135; s <= 300; s += 15) {
    arr.push(s);
  }

  return arr;
})();


function formatSecondsLabel(seconds: number): string {
  if (seconds === 0) return "OFF";
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;

  if (remain === 0) return `${minutes}m ${remain}s`;
  return `${minutes}m ${remain}s`;
}

export function RestTimerModal({
  open,
  exerciseName,
  currentSeconds,
  onSelect,
  onClose,
}: RestTimerModalProps) {
  const options = DEFAULT_REST_OPTIONS;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  // helper: center a value in the gray band
  const scrollToValue = useCallback(
    (value: number, behavior: ScrollBehavior = "auto") => {
      const container = scrollRef.current;
      if (!container) return;

      const items = Array.from(
        container.querySelectorAll<HTMLButtonElement>("[data-option='true']")
      );
      const index = options.indexOf(value);
      if (index === -1 || !items[index]) return;

      const el = items[index];
      const offset =
        el.offsetTop + el.offsetHeight / 2 - container.clientHeight / 2;

      container.scrollTo({ top: offset, behavior });
    },
    [options]
  );

  // when modal opens or currentSeconds changes, center that value
  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      scrollToValue(currentSeconds, "auto");
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, currentSeconds, scrollToValue]);

  // snap to nearest option when scroll stops
  const handleScroll = () => {
    if (!scrollRef.current) return;

    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      const container = scrollRef.current;
      if (!container) return;

      const items = Array.from(
        container.querySelectorAll<HTMLButtonElement>("[data-option='true']")
      );
      if (!items.length) return;

      const containerRect = container.getBoundingClientRect();
      const centerY = containerRect.top + containerRect.height / 2;

      let closestIndex = 0;
      let minDist = Infinity;

      items.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const dist = Math.abs(centerY - itemCenter);
        if (dist < minDist) {
          minDist = dist;
          closestIndex = index;
        }
      });

      const nearestSeconds = options[closestIndex];
      onSelect(nearestSeconds);                 // update selected value
      scrollToValue(nearestSeconds, "smooth");  // snap into center
    }, 80) as unknown as number;
  };

  // cleanup timer
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full mx-auto rounded-t-[24px] bg-white pb-8 pt-3 px-4">
        {/* drag handle */}
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-400" />

        {/* title + subtitle */}
        <h2 className="text-center text-sm font-regular mb-1">
          Rest Timer
        </h2>
        <p className="text-center text-sm text-gray-400 mb-4">
          Rest Timer - {exerciseName}
        </p>

        {/* picker */}
        <div className="relative mb-6">
          {/* center highlight band */}
          <div className="pointer-events-none absolute inset-x-3 top-1/2 -translate-y-1/2 h-10 rounded-[10px] bg-gray-100" />

          {/* scrollable list */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="relative max-h-64 overflow-y-auto py-4 space-y-1"
          >
            {options.map((seconds) => {
              const isActive = currentSeconds === seconds;

              return (
                <button
                  key={seconds}
                  type="button"
                  data-option="true"
                  onClick={() => {
                    onSelect(seconds);
                    scrollToValue(seconds, "smooth");
                  }}
                  className={`w-full py-1 text-sm text-center transition ${
                    isActive ? "font-regular text-black" : "text-gray-400"
                  }`}
                >
                  {formatSecondsLabel(seconds)}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          className="w-full text-sm bg-blue-500 py-5 rounded-[10px]"
          onClick={onClose}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
