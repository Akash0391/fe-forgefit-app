"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronRight, ImagePlus } from "lucide-react";
import { workoutApi, Workout, SetData } from "@/lib/api";
import MediaSelectionModal from "@/components/MediaSelectionModal";
import VisibilityModal from "@/components/VisibilityModal";
import DiscardWorkoutModal from "@/components/DiscardWorkoutModal";

export default function FinishWorkoutPage() {
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"Everyone" | "Private">("Everyone");
  const [showHeartRate, setShowHeartRate] = useState(true);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  useEffect(() => {
    loadWorkout();
  }, []);

  const loadWorkout = async () => {
    try {
      // First try to get the most recent completed workout from history
      const historyResponse = await workoutApi.getHistory();
      if (historyResponse.data && historyResponse.data.length > 0) {
        const latestWorkout = historyResponse.data[0];
        // Check if this workout was completed very recently (within last minute)
        const endTime = latestWorkout.endTime ? new Date(latestWorkout.endTime).getTime() : 0;
        const now = Date.now();
        if (endTime > 0 && (now - endTime) < 60000) {
          // This is likely the workout we just finished
          setWorkout(latestWorkout);
          setWorkoutTitle("");
          setLoading(false);
          return;
        }
      }
      
      // Fallback: Try to get active workout (in case finish hasn't completed yet)
      const activeResponse = await workoutApi.getActive();
      if (activeResponse.data) {
        setWorkout(activeResponse.data);
        setWorkoutTitle("");
      } else if (historyResponse.data && historyResponse.data.length > 0) {
        // Use the most recent workout even if it's older
        const latestWorkout = historyResponse.data[0];
        setWorkout(latestWorkout);
        setWorkoutTitle("");
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading workout:", error);
      setLoading(false);
    }
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

  const calculateTotalVolume = (): number => {
    if (!workout) return 0;
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

  const calculateTotalSets = (): number => {
    if (!workout) return 0;
    let totalSets = 0;
    workout.exercises.forEach((exercise) => {
      totalSets += exercise.sets.length;
    });
    return totalSets;
  };

  const formatDateTime = (): string => {
    if (!workout) return "";
    const date = workout.endTime ? new Date(workout.endTime) : (workout.startTime ? new Date(workout.startTime) : new Date());
    const day = date.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${day} ${month} ${year}, ${hours}:${minutesStr} ${ampm}`;
  };

  const handleBack = () => {
    router.push("/workout");
  };

  const handleSave = async () => {
    // TODO: Implement save functionality
    router.push("/workout/quick-start/finish-workout/success");
  };

  const handleDiscard = () => {
    setShowDiscardDialog(true);
  };

  const handleDiscardConfirm = () => {
    router.push("/workout");
  };

  const handleTakePhoto = () => {
    // TODO: Implement take photo functionality
    console.log("Take photo clicked");
  };

  const handleSelectFromLibrary = () => {
    // TODO: Implement select from library functionality
    console.log("Select from library clicked");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No workout data found</p>
      </div>
    );
  }

  const totalVolume = calculateTotalVolume();
  const totalSets = calculateTotalSets();
  const duration = workout.duration || 0;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-10 w-10"
            aria-label="Go back"
          >
            <ArrowLeft className="size-[24px]" />
          </Button>

          {/* Center: Title */}
          <h1 className="text-lg font-regular">Save Workout</h1>

          {/* Right: Save Button */}
          <Button
            variant="default"
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-lg font-regular text-white px-3 rounded-[6px] py-2 h-10"
          >
            Save
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-7 space-y-8">
        {/* Workout Title */}
        <Input
          type="text"
          placeholder="Workout title"
          value={workoutTitle}
          onChange={(e) => setWorkoutTitle(e.target.value)}
          className="text-xl font-bold border-none bg-transparent mb-12 p-1 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Duration</p>
            <p className="text-xl font-regular text-blue-500">
              {formatDuration(duration)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Volume</p>
            <p className="text-xl font-regular">{totalVolume} kg</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Sets</p>
            <p className="text-xl font-regular">{totalSets}</p>
          </div>
        </div>

        {/* When */}
        <div>
          <p className="text-sm text-gray-500 mb-1">When</p>
          <p className="text-lg text-blue-500">{formatDateTime()}</p>
        </div>

        {/* Add Photo/Video */}
        <button
          onClick={() => setShowMediaModal(true)}
          className="flex flex-row items-center gap-5 w-full text-left"
        >
          <div className="border-2 border-dashed border-gray-200 rounded-[10px] p-10 flex items-center justify-center min-w-[100px] min-h-[100px]">
            <ImagePlus className="size-8 text-black" />
          </div>
          <p className="text-black text-lg font-regular">Add a photo / video</p>
        </button>

        {/* Description */}
        <div>
          <label className="text-sm text-gray-500 mb-2 block">Description</label>
          <Input
            placeholder="How did your workout go? Leave some notes here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-1 text-lg border-none bg-transparent rounded-lg font-regular text-black placeholder:text-gray-400 resize-none"
          />
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between">
          <label className="text-lg font-regular text-black">Visibility</label>
          <button
            onClick={() => setShowVisibilityModal(true)}
            className="flex items-center gap-2 text-lg font-regular text-gray-500"
          >
            <span>{visibility}</span>
            <ChevronRight className="size-6 text-gray-400" />
          </button>
        </div>

        {/* Discard Workout */}
        <div className="pb-6 text-center">
          <button
            onClick={handleDiscard}
            className="text-red-500 text-lg font-regular"
          >
            Discard Workout
          </button>
        </div>
      </div>

      {/* Media Selection Modal */}
      <MediaSelectionModal
        open={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onTakePhoto={handleTakePhoto}
        onSelectFromLibrary={handleSelectFromLibrary}
      />

      {/* Visibility Modal */}
      <VisibilityModal
        open={showVisibilityModal}
        onClose={() => setShowVisibilityModal(false)}
        visibility={visibility}
        onVisibilityChange={setVisibility}
        showHeartRate={showHeartRate}
        onShowHeartRateChange={setShowHeartRate}
      />

      {/* Discard Workout Modal */}
      <DiscardWorkoutModal
        open={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={handleDiscardConfirm}
      />
    </div>
  );
}

