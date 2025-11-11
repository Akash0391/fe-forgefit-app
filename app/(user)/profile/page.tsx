"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ShareIcon,
  Settings,
  Dumbbell,
  ChevronDown,
  TrendingUp,
  ChartNoAxesColumnIncreasing,
  PersonStanding,
  CalendarDays,
  LogOut,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [selectedMetric, setSelectedMetric] = useState<
    "Duration" | "Volume" | "Reps"
  >("Duration");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutExecutedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate username from email or name
  const getUsername = () => {
    if (user?.email) {
      return user.email.split("@")[0];
    }
    if (user?.name) {
      return user.name.toLowerCase().replace(/\s+/g, "");
    }
    return "user";
  };

  const handleLogout = () => {
    if (logoutCountdown === null && !isLoggingOut) {
      // Start countdown
      logoutExecutedRef.current = false;
      setIsLoggingOut(true);
      setLogoutCountdown(5);
    }
  };

  // Handle countdown timer
  useEffect(() => {
    // Clear any existing timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (logoutCountdown !== null && logoutCountdown > 0) {
      // Start countdown interval
      countdownTimerRef.current = setInterval(() => {
        setLogoutCountdown((prev) => {
          if (prev === null || prev <= 1) {
            // Clear interval when countdown reaches 0
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (logoutCountdown === 0 && isLoggingOut && !logoutExecutedRef.current) {
      // Execute logout after countdown reaches 0 (only once)
      logoutExecutedRef.current = true;
      const executeLogout = async () => {
        try {
          console.log("Executing logout from profile page");
          await logout();
          console.log("Logout completed successfully");
          // Reset state after successful logout
          setIsLoggingOut(false);
          setLogoutCountdown(null);
        } catch (error) {
          console.error("Logout error in profile page:", error);
          // Reset state even on error (logout function handles redirect)
          setIsLoggingOut(false);
          setLogoutCountdown(null);
        }
      };
      executeLogout();
    }

    // Cleanup function
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [logoutCountdown, isLoggingOut, logout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Edit Profile */}
          <button className="text-blue-500 text-sm font-medium">
            Edit Profile
          </button>

          {/* Center: Username */}
          <h1 className="text-lg font-regular">{getUsername()}</h1>

          {/* Right: Share and Settings */}
          <div className="flex items-center gap-4">
            <button className="text-muted-foreground">
              <ShareIcon className="size-7" />
            </button>
            <button className="text-muted-foreground">
              <Settings className="size-7" />
            </button>
          </div>
        </div>
      </header>

      {/* Profile Information Section */}
      <div className="px-4 py-6">
        <div className="flex items-start gap-4">
          {/* Profile Picture */}
          <Avatar className="size-28">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>
              {user.name ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>

          {/* Name and Stats */}
          <div className="flex-1 pt-2">
            <h2 className="text-2xl font-semibold mb-4">{user.name || "User"}</h2>
            <div className="flex justify-between gap-6">
              <div>
                <p className="text-sm text-gray-500">Workouts</p>
                <p className="text-lg font-regular">0</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Followers</p>
                <p className="text-lg font-regular">0</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Following</p>
                <p className="text-lg font-regular">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Visualization Area */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-[10px] border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[150px]">
          <ChartNoAxesColumnIncreasing className="size-12 text-gray-300 mb-4" />
          <p className="text-muted-foreground">No data yet</p>
        </div>

        {/* Metric Selection Buttons */}
        <div className="flex gap-6 mt-4">
          <button
            onClick={() => setSelectedMetric("Duration")}
            className={`flex py-2 px-4 rounded-full text-lg font-regular transition-colors ${
              selectedMetric === "Duration"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-black border border-gray-300"
            }`}
          >
            Duration
          </button>
          <button
            onClick={() => setSelectedMetric("Volume")}
            className={`flex py-2 px-4 rounded-full text-lg font-regular transition-colors ${
              selectedMetric === "Volume"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-black border border-gray-300"
            }`}
          >
            Volume
          </button>
          <button
            onClick={() => setSelectedMetric("Reps")}
            className={`flex py-2 px-4 rounded-full text-lg font-regular transition-colors ${
              selectedMetric === "Reps"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-black border border-gray-300"
            }`}
          >
            Reps
          </button>
        </div>
      </div>

      {/* Dashboard Section */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-regular text-muted-foreground mb-4">
          Dashboard
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Statistics */}
          <button className="bg-gray-100 rounded-[10px] p-4 flex flex-row items-center  gap-3 hover:bg-gray-50 transition-colors">
            <TrendingUp className="size-6 text-gray-600" />
            <span className="text-lg font-regular">Statistics</span>
          </button>

          {/* Exercises */}
          <button className="bg-gray-100 rounded-[10px] p-4 flex flex-row items-center  gap-3 hover:bg-gray-50 transition-colors">
            <Dumbbell className="size-6 text-gray-600" />
            <span className="text-lg font-regular">Exercises</span>
          </button>

          {/* Measures */}
          <button className="bg-gray-100 rounded-[10px] p-4 flex flex-row items-center  gap-3 hover:bg-gray-50 transition-colors">
            <PersonStanding className="size-6 text-gray-600" />
            <span className="text-lg font-regular">Measures</span>
          </button>

          {/* Calendar */}
          <button className="bg-gray-100 rounded-[10px] p-4 flex flex-row items-center  gap-3 hover:bg-gray-50 transition-colors">
            <CalendarDays className="size-6 text-gray-600" />
            <span className="text-lg font-regular">Calendar</span>
          </button>
        </div>
      </div>

      {/* Workouts Section */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-regular text-muted-foreground mb-4">
          Workouts
        </h3>
        <div className="relative pb-3 pr-3">
          
          {/* Main card */}
          <div className="relative bg-white rounded-[10px] border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[150px] z-10">
            <Dumbbell className="size-14 text-gray-300 mb-4" />
            <p className="text-lg font-regular text-gray-500 mb-4">No workouts</p>
          </div>
        </div>
        <div className="flex justify-center mt-4">
        <button className="text-blue-500 text-lg font-regular flex items-center gap-1">
            Start tracking here
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>

      {/* Logout Section */}
      <div className="px-4 mb-6">
        {isLoggingOut && logoutCountdown !== null ? (
          <div className="bg-red-50 border border-red-200 rounded-[10px] p-4">
            <p className="text-red-700 text-center text-lg font-regular">
              Logging out in {logoutCountdown} second{logoutCountdown !== 1 ? "s" : ""}...
            </p>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white rounded-[10px] p-4 flex items-center justify-center gap-3 transition-colors"
          >
            <LogOut className="size-5" />
            <span className="text-lg font-regular">Logout</span>
          </button>
        )}
      </div>
    </div>
  );
}
