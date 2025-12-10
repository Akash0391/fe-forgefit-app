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
  Pencil,
  Ellipsis,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { workoutApi, Workout, SetData } from "@/lib/api";


export default function ProfilePage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [selectedMetric, setSelectedMetric] = useState<
    "Duration" | "Volume" | "Reps"
  >("Duration");
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutExecutedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        setWorkoutsLoading(true);
        const response = await workoutApi.getHistory();
        if (response.success) {
          const workoutsWithoutRoutines = response.data.filter(
            (workout: Workout) => !workout.isRoutine
          );
          setWorkouts(workoutsWithoutRoutines);
        }
      } catch (error) {
        console.error("Error loading workouts for profile:", error);
      } finally {
        setWorkoutsLoading(false);
      }
    };

    loadWorkouts();
  }, [user?._id]);


  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle workout options modal
  const handleOpenWorkoutModal = (workout: Workout) => {
    setSelectedWorkout(workout);
    setShowWorkoutModal(true);
  };

  const handleCloseWorkoutModal = () => {
    setShowWorkoutModal(false);
    setSelectedWorkout(null);
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `0min`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };


  const calculateTotalVolume = (workout: Workout): number => {
    let totalVolume = 0;
    workout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set: SetData) => {
        if (set.kg > 0 && set.reps > 0) {
          totalVolume += set.kg * set.reps;
        }
      });
    });
    return totalVolume;
  };

  const formatRelativeTime = (dateString?: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "a few seconds ago";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }
  };


  const getExerciseName = (exercise: any): string => {
    if (typeof exercise.exerciseId === "object" && exercise.exerciseId?.name) {
      const name = exercise.exerciseId.name;
      const equipment = exercise.exerciseId.equipment;
      if (equipment && equipment !== "None" && equipment !== "Bodyweight") {
        return `${name} (${equipment})`;
      }
      return name;
    }
    return "Exercise";
  };

  const getExerciseThumbnail = (exercise: any): string | null => {
    if (typeof exercise.exerciseId === "object") {
      return (
        exercise.exerciseId.gifUrl ||
        exercise.exerciseId.thumbnailUrl ||
        null
      );
    }
    return null;
  };

  const countCompletedSets = (sets: SetData[]): number =>
    sets.filter((set) => set.completed).length;


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

  const handleEditProfile = () => {
    router.push("/profile/edit-profile");
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">

          {/* Center: Username */}
          <h1 className="text-lg font-regular">{getUsername()}</h1>

          {/* Right: Share and Settings */}
          <div className="flex items-center gap-5">
            <button onClick={handleEditProfile} className="text-muted-foreground">
              <Pencil className="size-7" />
            </button>
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
            <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
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
                <p className="text-lg font-regular">{workouts.length}</p>

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
            className={`flex py-2 px-4 rounded-full text-lg font-regular transition-colors ${selectedMetric === "Duration"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-black border border-gray-300"
              }`}
          >
            Duration
          </button>
          <button
            onClick={() => setSelectedMetric("Volume")}
            className={`flex py-2 px-4 rounded-full text-lg font-regular transition-colors ${selectedMetric === "Volume"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-black border border-gray-300"
              }`}
          >
            Volume
          </button>
          <button
            onClick={() => setSelectedMetric("Reps")}
            className={`flex py-2 px-4 rounded-full text-lg font-regular transition-colors ${selectedMetric === "Reps"
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
      {/* Workouts Section */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-regular text-muted-foreground mb-4">
          Workouts
        </h3>

        {workoutsLoading ? (
          // 6.1 loading state
          <div className="bg-white rounded-[10px] border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[150px]">
            <p className="text-lg font-regular text-gray-500">
              Loading workouts...
            </p>
          </div>
        ) : workouts.length === 0 ? (
          // 6.2 empty state (what you already had)
          <>
            <div className="relative pb-3 pr-3">
              <div className="relative bg-white rounded-[10px] border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[150px] z-10">
                <Dumbbell className="size-14 text-gray-300 mb-4" />
                <p className="text-lg font-regular text-gray-500 mb-4">
                  No workouts
                </p>
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <button className="text-blue-500 text-lg font-regular flex items-center gap-1">
                Start tracking here
                <ChevronDown className="size-4" />
              </button>
            </div>
          </>
        ) : (
          // 6.3 actual workouts list (similar to Home)
          <div className="space-y-4">
            {workouts.map((workout) => {
              const totalVolume = calculateTotalVolume(workout);
              const workoutTime =
                workout.endTime || workout.startTime || workout.createdAt;

              return (
                <div
                  key={workout._id}
                  className="p-4 bg-white rounded-[10px] border border-gray-200"
                >
                  {/* card header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-12">
                        <AvatarImage
                          src={user?.avatar ?? undefined}
                          alt={getUsername()}
                        />
                        <AvatarFallback className="bg-orange-200 text-orange-700 text-sm font-semibold">
                          {getUsername().charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-lg font-regular text-gray-900">
                          {getUsername()}
                        </span>
                        <span className="text-sm font-regular text-gray-500">
                          {formatRelativeTime(workoutTime)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenWorkoutModal(workout)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Ellipsis className="size-7" />
                    </button>
                  </div>

                  {/* title */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {workout.name || "Quick Start Workout"}
                  </h3>

                  {/* stats */}
                  <div className="flex gap-6 mb-4 border-b border-gray-100 pb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Time</p>
                      <p className="text-base font-regular text-gray-900">
                        {formatDuration(workout.duration)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Volume</p>
                      <p className="text-base font-regular text-gray-900">
                        {totalVolume} kg
                      </p>
                    </div>
                  </div>

                  {/* exercises */}
                  <div className="space-y-3">
                    {workout.exercises.map((exercise, index) => {
                      const name = getExerciseName(exercise);
                      const completedSets = countCompletedSets(exercise.sets);
                      const thumbnail = getExerciseThumbnail(exercise);

                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="size-16 ml-2 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                            {thumbnail ? (
                              <img
                                src={thumbnail}
                                alt={name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Dumbbell className="size-5 text-gray-400" />
                            )}
                          </div>
                          <span className="text-base font-regular text-gray-900">
                            {completedSets} set
                            {completedSets !== 1 ? "s" : ""} {name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
