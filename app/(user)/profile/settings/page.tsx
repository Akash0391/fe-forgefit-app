'use client';
import { ArrowLeft, ChevronRight, Lock, LogOut, Moon, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";


export default function SettingsPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);
    const logoutExecutedRef = useRef<boolean>(false);

    const { logout } = useAuth();

const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogout = () => {
    if (logoutCountdown === null && !isLoggingOut) {
      // Start countdown
      logoutExecutedRef.current = false;
      setIsLoggingOut(true);
      setLogoutCountdown(5);
    }
  };

  useEffect(() => {
  if (countdownTimerRef.current) {
    clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = null;
  }

  if (logoutCountdown !== null && logoutCountdown > 0) {
    countdownTimerRef.current = setInterval(() => {
      setLogoutCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  } else if (
    logoutCountdown === 0 &&
    isLoggingOut &&
    !logoutExecutedRef.current
  ) {
    logoutExecutedRef.current = true;
    logout().finally(() => {
      setIsLoggingOut(false);
      setLogoutCountdown(null);
    });
  }

  return () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };
}, [logoutCountdown, isLoggingOut, logout]);


  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white relative flex items-center px-4 pt-4 pb-3 border-b border-gray-100">
        
        {/* Back button */}
        <button
          className="p-1 -ml-1"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </button>

        {/* Centered title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-normal">
          Settings
        </h1>

      </div>

      {/* Main Content */}
      <div className="py-4">
        {/* Account Settings */}
        <div className="mb-6">
          <h2 className="text-sm font-regular text-gray-400 mb-3 px-4">Account</h2>
          <button
            onClick={() => { router.push("/profile/edit-profile"); }}
            className="w-full flex items-center justify-between px-4 py-5 border-b border-gray-100 bg-white transition-colors"
          >
            <div className="flex flex-row items-center gap-3">
            <UserRound className="size-6 text-gray-600" />
            <span className="text-sm font-regular text-black">Profile</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronRight className="size-5 text-gray-400" />
            </div>
          </button>
          <button
            onClick={() => { router.push("/profile/settings/account-settings"); }}
            className="w-full flex items-center justify-between px-4 py-5 border-b border-gray-100 bg-white transition-colors"
          >
            <div className="flex flex-row items-center gap-3">
            <Lock className="size-6 text-gray-600" />
            <span className="text-sm font-regular text-black">Account</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronRight className="size-5 text-gray-400" />
            </div>
          </button>
          <button
            onClick={() => { router.push("/profile/settings/theme"); }}
            className="w-full flex items-center justify-between px-4 py-5 border-b border-gray-100 bg-white transition-colors"
          >
            <div className="flex flex-row items-center gap-3">
            <Moon className="size-6 text-gray-600" />
            <span className="text-sm font-regular text-black">Theme</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronRight className="size-5 text-gray-400" />
            </div>
          </button>
        </div>

        {/* Logout Section */}
      <div className="px-4 mb-6">
        {isLoggingOut && logoutCountdown !== null ? (
          <div className="bg-red-50 border border-red-200 rounded-[10px] p-4">
            <p className="text-red-700 text-center text-sm font-regular">
              Logging out in {logoutCountdown} second{logoutCountdown !== 1 ? "s" : ""}...
            </p>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white rounded-[10px] p-4 flex items-center justify-center gap-3 transition-colors"
          >
            <LogOut className="size-5" />
            <span className="text-sm font-regular">Logout</span>
          </button>
        )}
      </div>
        </div>
    </div>
  );
}
