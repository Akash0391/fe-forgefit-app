"use client";

import { useEffect, useState, useRef } from "react";
import { Check, CircleQuestionMark, HelpCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";

interface VisibilityModalProps {
  open: boolean;
  onClose: () => void;
  visibility: "Everyone" | "Private";
  onVisibilityChange: (visibility: "Everyone" | "Private") => void;
  showHeartRate: boolean;
  onShowHeartRateChange: (show: boolean) => void;
}

export default function VisibilityModal({
  open,
  onClose,
  visibility,
  onVisibilityChange,
  showHeartRate,
  onShowHeartRateChange,
}: VisibilityModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    if (open) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Mount the component first
      setShouldRender(true);
      // Small delay to ensure DOM is ready before starting transition
      setTimeout(() => {
        setIsVisible(true);
      }, 10);
    } else {
      // Start closing transition immediately
      setIsVisible(false);
      // Delay unmounting to allow transition to complete
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match the transition duration
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ease-in-out ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        style={{ pointerEvents: isVisible ? "auto" : "none" }}
      />
      {/* Modal Content - Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-100 rounded-t-[30px] shadow-lg transition-all duration-300 ease-in-out min-h-[50vh] ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-2">
          <div className="h-1 w-12 bg-gray-400 rounded-lg"></div>
        </div>

        <div className="py-3 pb-6">    
          <div className="mb-3 text-center border-b border-gray-200 -mx-6 px-6">
            {/* Title */}
            <h2 className="text-sm font-regular text-black mb-3">Visibility</h2>
          </div>

        <div className="px-6">

          <div className="mb-3">
            <p className="text-xm font-regular text-gray-500">
              Workout Visibility
            </p>
          </div>

          {/* Visibility Options */}
          <div className="bg-white rounded-[10px] overflow-hidden mb-2">
            {/* Everyone Option */}
            <button
              onClick={() => {
                onVisibilityChange("Everyone");
                onClose();
              }}
              className="w-full flex items-center gap-4 px-5 py-4 transition-colors text-left hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100"
            >
              <div className="flex-1">
                <div className="mb-1">
                  <span className="text-xm font-regular text-black">
                    Everyone
                  </span>
                </div>
                <p className="text-sm font-regular text-gray-500">
                  This workout is publicly available to all users on ForgeFit.
                </p>
              </div>
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                {visibility === "Everyone" && (
                  <Check className="size-5 text-blue-500" />
                )}
              </div>
            </button>

            {/* Private Option */}
            <button
              onClick={() => {
                onVisibilityChange("Private");
                onClose();
              }}
              className="w-full flex items-center gap-4 px-5 py-4 transition-colors text-left hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="flex-1">
                <div className="mb-1">
                  <span className="text-xm font-regular text-black">
                    Private
                  </span>
                </div>
                <p className="text-sm font-regular text-gray-500">
                  Keep this workout private and visible only to you for personal
                  use.
                </p>
              </div>
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                {visibility === "Private" && (
                  <Check className="size-5 text-blue-500" />
                )}
              </div>
            </button>
          </div>

          <div className="mb-4 mt-4 ">
            <div className="flex items-center justify-between">
            <p className="text-xm font-regular text-gray-500">
              Public Data
            </p>
            <button
              onClick={() => setShowInfoModal(true)}
              className="flex items-center justify-center rounded-full bg-gray-200 p-1 hover:bg-gray-300 transition-colors"
            >
              <Image src="/icons/punctuation-marks.png" alt="Info" width={10} height={10} />
            </button>
            </div>
          </div>

          {/* Public Data Section */}
          <div className="bg-white rounded-[10px] overflow-hidden px-6 py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-regular text-black">
                Show My Heart Rate & Calories
              </span>
              <Switch 
                checked={showHeartRate}
                onCheckedChange={onShowHeartRateChange}
                className="h-7 w-13 data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300 [&>[data-slot=switch-thumb]]:size-6 [&>[data-slot=switch-thumb]]:bg-white [&>[data-slot=switch-thumb]]:data-[state=checked]:translate-x-[1.5rem] [&>[data-slot=switch-thumb]]:data-[state=unchecked]:translate-x-[0.125rem]"
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ease-in-out"
            onClick={() => setShowInfoModal(false)}
          />
          {/* Modal Content - Center */}
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-[12px] shadow-lg transition-all duration-300 ease-in-out w-[90%] max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <p className="text-sm font-regular text-gray-700 mb-8 mt-2 text-center">
                When enabled, and while working out with your wearable, your heart rate and calorie data will be displayed publicly with your workout.
              </p>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-[10px] font-regular text-sm hover:bg-blue-600 transition-colors"
              >
                Ok
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
