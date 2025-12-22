"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Workout, SetData, workoutApi, authApi } from "@/lib/api";
import WorkoutShareCard from "@/components/WorkoutShareCard";


export default function WorkoutSuccessPage() {
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [activeCard, setActiveCard] = useState(0);
  const cards: (0 | 1 | 2 | 3)[] = [0, 1, 2];
  const [workoutCount, setWorkoutCount] = useState<number | null>(null);
  const [username, setUsername] = useState<string>("user");

  const getOrdinal = (n: number): string => {
  const rem10 = n % 10;
  const rem100 = n % 100;

  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  if (rem10 === 1) return `${n}st`;
  if (rem10 === 2) return `${n}nd`;
  if (rem10 === 3) return `${n}rd`;
  return `${n}th`;
};


  useEffect(() => {
  const load = async () => {
    const dataStr = sessionStorage.getItem("lastFinishedWorkout");
    if (!dataStr) {
      router.push("/home");
      return;
    }

    try {
        const parsed: Workout = JSON.parse(dataStr);
        setWorkout(parsed);

        // get username from /me
        try {
          const me = await authApi.getMe();
          const u = (me as any).data?.user ?? me.data; // handle both shapes
          const name =
            u?.name ||
            u?.firstName ||
            u?.email?.split("@")[0] ||
            "user";

          setUsername(name);
        } catch (err) {
          console.warn("Could not fetch /me on success page, using default username");
        }

      // fetch total finished workouts (excluding routines, like on HomePage)
      const res = await workoutApi.getHistory();
      if (res.success) {
        const workoutsWithoutRoutines = res.data.filter(
          (w: Workout) => !w.isRoutine
        );
        setWorkoutCount(workoutsWithoutRoutines.length);
      }
    } catch (e) {
      console.error("Error parsing lastFinishedWorkout:", e);
      router.push("/home");
    }
  };

  load();
}, [router]);


  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return "0min";
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins}min`;
  };

  const calculateTotalVolume = (w: Workout): number =>
    w.exercises.reduce((sum, ex) => {
      return (
        sum +
        ex.sets.reduce((setSum: number, s: SetData) => {
          if (!s.completed) return setSum;
          return setSum + (s.kg || 0) * (s.reps || 0);
        }, 0)
      );
    }, 0);

  const calculateTotalSets = (w: Workout): number =>
    w.exercises.reduce((sum, ex) => {
      return sum + ex.sets.filter((s: SetData) => s.completed).length;
    }, 0);

  const exerciseCount = workout ? workout.exercises.length : 0;
  const durationText = workout ? formatDuration(workout.duration) : "0min";
  const volumeText = workout ? `${calculateTotalVolume(workout)} kg` : "0 kg";
  const setsText = workout ? `${calculateTotalSets(workout)}` : "0";


  const handleDone = () => {
    router.push("/home");
  };

  if (!workout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading workout...</p>
      </div>
    );
  }


  return (
    <div className="fixed inset-0 flex flex-col bg-white overflow-hidden">

      {/* HEADER */}
      <div className="pt-6 pb-4 px-4 text-center relative">
        <h1 className="text-lg font-bold text-black mb-1">Nice Work!</h1>
        <p className="text-gray-500 text-sm">
        {workoutCount
          ? `This is your ${getOrdinal(workoutCount)} workout`
          : "Workout summary"}
      </p>

        {/* optional celebration icon on right */}
        <div className="absolute right-4 top-6">
          🎉
        </div>
      </div>

      {/* CARD AREA – horizontal scroll */}
      <div className="flex-1 overflow-hidden">
        <div className="w-full h-full flex items-start">
          <div className="w-full overflow-x-auto">
            <div className="flex flex-nowrap gap-15 px-10 pt-4 pb-2 snap-x snap-mandatory">
              {cards.map((v) => (
                <div
                  key={v}
                  className="flex-shrink-0 w-[100%] mx-auto snap-center h-[350px]"
                >
                  <WorkoutShareCard
                    workout={workout}
                    durationText={durationText}
                    volumeText={volumeText}
                    setsText={setsText}
                    variant={v}
                    username={username}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* Done Button – stays at bottom */}
      <div className="pb-6 px-2">
        <Button
          variant="default"
          onClick={handleDone}
          className="w-full bg-blue-500 hover:bg-blue-600 text-sm font-regular text-white py-4 rounded-[10px]"
        >
          Done
        </Button>
      </div>
    </div>

  );
}

