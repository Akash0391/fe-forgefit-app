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
  ThumbsUp,
  MessageCircle,
  Share,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { workoutApi, Workout, SetData, Exercise } from "@/lib/api";
import WorkoutOptionsModal from "@/components/WorkoutOptionsModal";
import DeleteWorkoutModal from "@/components/DeleteWorkoutModal";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);


export default function ProfilePage() {

  type Metric = "duration" | "volume" | "reps";

  type SummaryPoint = {
    date: string;
    durationSeconds: number;
    durationMinutes: number;
    totalVolumeKg: number;
    totalReps: number;
  };

  const [metric, setMetric] = useState<Metric>("duration");
  const [summary, setSummary] = useState<SummaryPoint[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [thisWeekHours, setThisWeekHours] = useState(0);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await workoutApi.getSummary("3m");
        if (res.success) {
          setSummary(res.data || []);
          setThisWeekHours(res.thisWeekHours ?? 0);
        }
      } catch (err) {
        console.error("Error loading workout summary:", err);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, []);

  // transform for chart – aggregate into 14-day buckets over last 3 months
  const chartData = (() => {
    if (!summary.length) return [];

    // Prepare data with Date objects
    const withDates = summary.map((item) => ({
      ...item,
      // force midnight to avoid timezone drift
      dateObj: new Date(item.date + "T00:00:00"),
    }));

    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setMonth(rangeStart.getMonth() - 3); // same "3m" range as backend
    rangeStart.setHours(0, 0, 0, 0);

    const buckets: {
      label: string;
      durationMinutes: number;
      totalVolumeKg: number;
      totalReps: number;
    }[] = [];

    let bucketStart = rangeStart;

    while (bucketStart <= now) {
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketEnd.getDate() + 13); // 14-day window

      let durationMinutes = 0;
      let totalVolumeKg = 0;
      let totalReps = 0;

      // Sum all days that fall inside this 14-day window
      withDates.forEach((item) => {
        if (item.dateObj >= bucketStart && item.dateObj <= bucketEnd) {
          durationMinutes += item.durationMinutes;
          totalVolumeKg += item.totalVolumeKg;
          totalReps += item.totalReps;
        }
      });

      buckets.push({
        label: bucketStart.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        durationMinutes,
        totalVolumeKg,
        totalReps,
      });

      // move start forward by 14 days
      bucketStart = new Date(bucketStart);
      bucketStart.setDate(bucketStart.getDate() + 14);
    }

    return buckets;
  })();

  // ---------- METRIC VALUES + BAR DATA ----------
  const metricValues = chartData.map((d) =>
    metric === "duration"
      ? d.durationMinutes / 60 // show in hours on Y-axis
      : metric === "volume"
        ? d.totalVolumeKg
        : d.totalReps
  );


  const dataForChart = {
    labels: chartData.map((d) => d.label),
    datasets: [
      {
        label:
          metric === "duration"
            ? "Duration (min)"
            : metric === "volume"
              ? "Volume (kg)"
              : "Reps",
        data: chartData.map((d) =>
          metric === "duration"
            ? d.durationMinutes
            : metric === "volume"
              ? d.totalVolumeKg
              : d.totalReps
        ),
        backgroundColor: "#2196F3",
        barPercentage: 0.7,       // 0–1, smaller = thinner inside category
        categoryPercentage: 0.6,  // space between groups
        maxBarThickness: 20,
      },
    ],
  };

  // ---------- Y-AXIS CONFIG PER METRIC ----------
  const maxValue = metricValues.length ? Math.max(...metricValues) : 0;

  let yStepSize: number;
  let ySuggestedMax: number;
  let yTickFormatter: (v: number) => string;

  if (metric === "duration") {
    // 0h, 1h, 2h...
    yStepSize = 1;
    ySuggestedMax = Math.max(1, Math.ceil(maxValue));
    yTickFormatter = (v) => `${v}h`;
  } else if (metric === "volume") {
    // 0kg, 1kg, 2kg...
    yStepSize = 1;
    ySuggestedMax = Math.max(1, Math.ceil(maxValue));
    yTickFormatter = (v) => `${v}kg`;
  } else {
    // reps: 0, 100, 200, 300...
    yStepSize = 100;
    ySuggestedMax = Math.max(100, Math.ceil(maxValue / 100) * 100);
    yTickFormatter = (v) => `${v}reps`;
  }


  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const v = ctx.raw ?? 0;
            if (metric === "duration") return `${v} h`;
            if (metric === "volume") return `${v} kg`;
            return `${v} reps`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        suggestedMax: ySuggestedMax,
        grid: { color: "#f3f4f6" },
        ticks: {
          stepSize: yStepSize,
          font: { size: 10 },
          callback: (value: any) => yTickFormatter(Number(value)),
        },
      },
    },
  } as const;

  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [selectedMetric, setSelectedMetric] = useState<
    "Duration" | "Volume" | "Reps"
  >("Duration");

  useEffect(() => {
    if (selectedMetric === "Duration") {
      setMetric("duration");
    } else if (selectedMetric === "Volume") {
      setMetric("volume");
    } else {
      setMetric("reps");
    }
  }, [selectedMetric]);


  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const handleEditWorkout = () => {
    if (!selectedWorkout) return;

    // store full workout to edit
    sessionStorage.setItem(
      "workoutToEdit",
      JSON.stringify(selectedWorkout)
    );

    // close modal
    setShowWorkoutModal(false);

    // go to finish-workout page in edit mode
    router.push("/workout/quick-start/finish-workout?mode=edit");
  };

  const handleConfirmDelete = async () => {
    if (!selectedWorkout) return;

    try {
      // Call delete workout API
      await workoutApi.delete(selectedWorkout._id);

      // Remove workout from list
      setWorkouts(workouts.filter((w) => w._id !== selectedWorkout._id));

      // Close modals
      setShowDeleteModal(false);
      setShowWorkoutModal(false);
      setSelectedWorkout(null);
    } catch (error) {
      console.error("Error deleting workout:", error);
      // Keep modals open on error so user can retry
    }
  };

  const handleShareWorkout = () => {
    // TODO: Implement share workout functionality
    console.log("Share workout:", selectedWorkout?._id);
  };

  const handleToggleVisibility = () => {
    // TODO: Implement toggle visibility functionality
    console.log("Toggle visibility:", selectedWorkout?._id);
  };

  const handleCopyWorkout = () => {
    if (!selectedWorkout) return;

    const workout = selectedWorkout;

    const payload = {
      exercises: (workout.exercises || []).map((we: any) => {
        const exercise: Exercise =
          typeof we.exerciseId === "object"
            ? (we.exerciseId as Exercise)
            : ({ _id: we.exerciseId, name: "Exercise" } as Exercise);

        return {
          exercise,                        // full Exercise object
          sets: we.sets || [],
          restTimerSeconds: we.restTimerSeconds ?? 0,
        };
      }),

      // keep supersets so UI matches the original workout
      supersetGroups: (workout.supersetGroups || []).map((group: any) =>
        Array.isArray(group) ? group : group.exerciseIds || []
      ),
    };

    sessionStorage.setItem(
      "copyWorkoutToQuickStart",
      JSON.stringify(payload)
    );

    // we’re starting a brand-new workout from this copy
    localStorage.removeItem("workoutStartTime");
    localStorage.removeItem("workoutInProgress");

    setShowWorkoutModal(false);
    router.push("/workout/quick-start");
  };

  const handleSaveAsRoutine = () => {
    if (!selectedWorkout) return;            // safety

    const workout = selectedWorkout;

    const payload = {
      name: workout.name || "",
      exercises: (workout.exercises || []).map((we: any) => {
        const exercise: Exercise =
          typeof we.exerciseId === "object"
            ? (we.exerciseId as Exercise)
            : ({ _id: we.exerciseId, name: "Exercise" } as Exercise);

        return {
          exercise,
          sets: we.sets || [],
          notes: we.notes || "",
          restTimerSeconds: we.restTimerSeconds ?? 0,   // ✅ keep rest timer
        };
      }),
      supersetGroups: (workout.supersetGroups || []).map((group: any) =>
        Array.isArray(group) ? group : group.exerciseIds || []
      ),
    };

    sessionStorage.setItem("workoutToRoutine", JSON.stringify(payload));
    router.push("/workout/new-routine");
  };

  const handleDeleteWorkoutClick = () => {
    // Close workout options modal and open delete confirmation modal
    setShowWorkoutModal(false);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    // Also close workout options modal when delete modal is closed
    setShowWorkoutModal(false);
    setSelectedWorkout(null);
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

  const handleStatistics = () => {
    console.log("statistics clicked")
  }

  const handleExercises = () => {
    console.log("exercises clicked")
  }

  const handleCalendar = () => {
    console.log("calendar clicked")
  }

  const handleMeasures = () => {
    console.log("meadures clicked")
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
        {/* Workout summary card with Chart.js */}
        <div className="">
          <div className="p-4">
            {/* Top row: "X hours this week" (optional) */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg text-gray-500">
                {thisWeekHours} hours this week
              </span>
            </div>

            {/* Chart / empty states */}
            {loadingSummary ? (
              <div className="h-32 flex items-center justify-center text-sm text-gray-400">
                Loading…
              </div>
            ) : summary.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-sm text-gray-400">
                <span className="mb-1">No data yet</span>
                <span className="text-xs">Complete a workout to see stats</span>
              </div>
            ) : (
              <div className="h-44 w-full ml-[-10]">
                <Bar data={dataForChart} options={options} />
              </div>
            )}
          </div>
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
          <button onClick={handleStatistics} className="bg-gray-100 rounded-[10px] p-4 flex flex-row items-center  gap-3 hover:bg-gray-50 transition-colors">
            <TrendingUp className="size-6 text-gray-600" />
            <span className="text-lg font-regular">Statistics</span>
          </button>

          {/* Exercises */}
          <button onClick={handleExercises} className="bg-gray-100 rounded-[10px] p-4 flex flex-row items-center  gap-3 hover:bg-gray-50 transition-colors">
            <Dumbbell className="size-6 text-gray-600" />
            <span className="text-lg font-regular">Exercises</span>
          </button>

          {/* Measures */}
          <button onClick={handleMeasures} className="bg-gray-100 rounded-[10px] p-4 flex flex-row items-center  gap-3 hover:bg-gray-50 transition-colors">
            <PersonStanding className="size-6 text-gray-600" />
            <span className="text-lg font-regular">Measures</span>
          </button>

          {/* Calendar */}
          <button onClick={handleCalendar} className="bg-gray-100 rounded-[10px] p-4 flex flex-row items-center  gap-3 hover:bg-gray-50 transition-colors">
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
                  {/* Action Buttons: Like, Comment, Share */}
                  <div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-100">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                      <ThumbsUp className="size-7" />
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                      <MessageCircle className="size-7" />
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                      <Share className="size-7" />
                    </button>
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

      {/* Workout Options Modal */}
      <WorkoutOptionsModal
        open={showWorkoutModal}
        onClose={handleCloseWorkoutModal}
        workout={selectedWorkout}
        onEdit={handleEditWorkout}
        onDelete={handleConfirmDelete}
        onShare={handleShareWorkout}
        onCopy={handleCopyWorkout}
        onToggleVisibility={handleToggleVisibility}
        onSaveAsRoutine={handleSaveAsRoutine}
        onDeleteClick={handleDeleteWorkoutClick}
      />

      {/* Delete Workout Confirmation Modal */}
      <DeleteWorkoutModal
        open={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        message="Are you sure you want to delete this workout?"
      />
    </div>
  );
}
