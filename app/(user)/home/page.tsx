"use client";

import { useEffect, useState, useRef } from "react";
import { workoutApi, Workout, SetData, Exercise } from "@/lib/api";
import {
  Calendar,
  Clock,
  Dumbbell,
  TrendingUp,
  X,
  Search,
  Bell,
  ChevronDown,
  MoreVertical,
  ThumbsUp,
  MessageCircle,
  Share,
  Ellipsis,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import WorkoutOptionsModal from "@/components/WorkoutOptionsModal";
import DeleteWorkoutModal from "@/components/DeleteWorkoutModal";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeSlides, setActiveSlides] = useState<Record<string, number>>({});
  const swipeRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();
  const isVideo = (url: string) => {
    return url.includes("/video/") || url.endsWith(".mp4");
  };

  const setSlideForWorkout = (workoutId: string, index: number) => {
    setActiveSlides((prev) => ({
      ...prev,
      [workoutId]: index,
    }));
  };



  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const response = await workoutApi.getHistory();
      if (response.success) {
        // Filter out routines - only show actual completed workouts
        const workoutsWithoutRoutines = response.data.filter(
          (workout: Workout) => !workout.isRoutine
        );
        setWorkouts(workoutsWithoutRoutines);
      }
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleNotification = () => {
    router.push("/home/notifications");
  }
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

  const calculateTotalSets = (workout: Workout): number => {
    let totalSets = 0;
    workout.exercises.forEach((exercise) => {
      totalSets += exercise.sets.length;
    });
    return totalSets;
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${day} ${month} ${year}, ${hours}:${minutesStr} ${ampm}`;
  };

  // Generate username from email or name
  const getUsername = (): string => {
    if (user?.email) {
      return user.email.split("@")[0];
    }
    if (user?.name) {
      return user.name.split(" ")[0]; // Use first name if available
    }
    return "there";
  };

  // Format relative time (e.g., "a few seconds ago", "5 minutes ago")
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

  // Get exercise name from workout exercise
  const getExerciseName = (exercise: any): string => {
    if (typeof exercise.exerciseId === "object" && exercise.exerciseId?.name) {
      const name = exercise.exerciseId.name;
      const equipment = exercise.exerciseId.equipment;
      // Add equipment in parentheses if available (e.g., "Bench Press (Barbell)")
      if (equipment && equipment !== "None" && equipment !== "Bodyweight") {
        return `${name} (${equipment})`;
      }
      return name;
    }
    return "Exercise";
  };

  function getExerciseThumbnail(exercise: any) {
  const ex = exercise?.exerciseId;

  // case 1: populated object
  if (ex && typeof ex === "object") {
    return ex.gifUrl || ex.thumbnailUrl || null;
  }

  // case 2: missing / deleted exercise
  if (!ex) return null;

  // case 3: it's just an ID string
  return null;
}

  // Count completed sets for an exercise
  const countCompletedSets = (sets: SetData[]): number => {
    return sets.filter((set) => set.completed).length;
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

  const handleShareWorkout = () => {
    // TODO: Implement share workout functionality
    console.log("Share workout:", selectedWorkout?._id);
  };

  const handleToggleVisibility = () => {
    // TODO: Implement toggle visibility functionality
    console.log("Toggle visibility:", selectedWorkout?._id);
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



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading workouts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-[4px] text-sm font-regular text-gray-700 transition-colors">
            <span>Home</span>
            <ChevronDown className="size-4" />
          </button>
          <div className="flex items-center gap-4">
            <button className="text-gray-700 hover:text-gray-900 transition-colors">
              <Search className="size-6" />
            </button>
            <button onClick={handleNotification} className="text-gray-700 hover:text-gray-900 transition-colors">
              <Bell className="size-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-2 bg-white">
        {workouts.length === 0 ? (
          <div className="space-y-4">
            {showWelcome && (
              <div className="">
                <div className="flex flex-row items-center justify-between">
                  <h2 className="text-sm font-semibold">
                    Hey {getUsername()}! 👋
                  </h2>
                  <button
                    onClick={() => setShowWelcome(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center"
                    aria-label="Dismiss welcome message"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="pr-8 mt-4">
                  <p className="text-black text-sm font-regular leading-relaxed mb-4">
                    My name is Akash, I built ForgeFit. Thank you for tying out
                    the app!
                  </p>
                  <p className="text-black text-sm font-regular mb-4">
                    I'm trying to build the best workout tracker ever, so any
                    feedback you have would be greatly appreciated.
                  </p>
                  <p className="text-black text-sm font-regular">
                    You can email me at akashjaunpur0391@gmail.com, and feel
                    free to follow me!
                  </p>
                </div>
                {/* Profile Card */}
                <div className="flex flex-row items-center gap-6 mt-6">
                  <Avatar className="size-30">
                    <AvatarImage src="/images/developer-photo.png" alt="Akash" />
                    <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-semibold">
                      A
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col justify-between gap-2 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 w-full">
                      Akash Yadav
                    </h3>
                    <Button
                      variant="default"
                      className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-6 rounded-[8px] font-regular text-sm transition-colors"
                    >
                      Follow
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col items-center bg-gray-100 rounded-[10px] justify-center py-12">
              <Dumbbell className="size-12 text-gray-300 mb-4" />
              <h2 className="text-sm font-semibold mb-2">No workouts yet</h2>
              <p className="text-muted-foreground text-center">
                Complete a workout to see it here
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => {
              const totalVolume = calculateTotalVolume(workout);
              const workoutTime = workout.endTime || workout.startTime || workout.createdAt;
              const hasMedia = workout.media && workout.media.length > 0;


              return (
                <div
                  key={workout._id}
                  className="p-2"
                >
                  {/* Header: Profile, Username, Time, Menu */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-15">
                        <AvatarImage src={user?.avatar ?? undefined} alt={getUsername()} className="object-cover" />
                        <AvatarFallback className="bg-orange-200 text-orange-700 text-sm font-semibold">
                          {getUsername().charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-regular text-gray-900">
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
                      <Ellipsis className="size-6" />
                    </button>
                  </div>

                  {/* Workout Title */}
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    {workout.name || "Quick Start Workout"}
                  </h3>

                  {/* Workout Stats: Time and Volume */}
                  <div className="flex gap-6 mb-4 border-b border-gray-100 pb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Time</p>
                      <p className="text-sm font-regular text-gray-900">
                        {formatDuration(workout.duration)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Volume</p>
                      <p className="text-sm font-regular text-gray-900">
                        {totalVolume} kg
                      </p>
                    </div>
                  </div>

                  {/* Swipeable Content */}
                  <div className="mb-4">
                    {hasMedia ? (
                      <>
                        <div
                          onScroll={(e) => {
                            const el = e.currentTarget;
                            const index = Math.round(el.scrollLeft / el.clientWidth);
                            setSlideForWorkout(workout._id, index);
                          }}
                          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
                        >
                          {/* 🖼 Media slides */}
                          {workout.media!.map((url, i) => (
                            <div key={i} className="min-w-full snap-center px-1">
                              <div className="rounded-[12px] overflow-hidden bg-gray-100">
                                <img
                                  src={url}
                                  alt={`Workout media ${i + 1}`}
                                  className="w-full h-100 object-cover"
                                />
                              </div>
                            </div>
                          ))}

                          {/* 🏋️ Exercise slide */}
                          <div className="min-w-full snap-center px-1">
                            <div className="bg-white rounded-[12px] p-4 space-y-3">
                              {workout.exercises.map((exercise, index) => {
                                const exerciseName = getExerciseName(exercise);
                                const completedSets = countCompletedSets(exercise.sets);
                                const thumbnail = getExerciseThumbnail(exercise);

                                return (
                                  <div key={index} className="flex items-center gap-3">
                                    <div className="size-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                      {thumbnail ? (
                                        <img
                                          src={thumbnail}
                                          alt={exerciseName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <Dumbbell className="size-4 text-gray-400" />
                                      )}
                                    </div>
                                    <span className="text-sm font-regular text-gray-900">
                                      {completedSets} set{completedSets !== 1 ? "s" : ""}{" "}
                                      {exerciseName}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* 🔘 Dynamic dots */}
                        <div className="flex justify-center gap-2 mt-2">
                          {Array.from({ length: workout.media!.length + 1 }).map((_, i) => (
                            <span
                              key={i}
                              className={`w-2 h-2 rounded-full transition-all ${(activeSlides[workout._id] ?? 0) === i
                                  ? "bg-gray-600"
                                  : "bg-gray-300"
                                }`}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      /* No media → show exercises directly */
                      <div className="bg-white rounded-[12px] p-4 space-y-3">
                        {workout.exercises.map((exercise, index) => {
                          const exerciseName = getExerciseName(exercise);
                          const completedSets = countCompletedSets(exercise.sets);
                          const thumbnail = getExerciseThumbnail(exercise);

                          return (
                            <div key={index} className="flex items-center gap-3">
                              <div className="size-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                {thumbnail ? (
                                  <img
                                    src={thumbnail}
                                    alt={exerciseName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Dumbbell className="size-4 text-gray-400" />
                                )}
                              </div>
                              <span className="text-sm font-regular text-gray-900">
                                {completedSets} set{completedSets !== 1 ? "s" : ""}{" "}
                                {exerciseName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>



                  {/* Action Buttons: Like, Comment, Share */}
                  <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                      <ThumbsUp className="size-6" />
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                      <MessageCircle className="size-6" />
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                      <Share className="size-6" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
