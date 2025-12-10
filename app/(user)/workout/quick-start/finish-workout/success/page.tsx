"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Workout, SetData } from "@/lib/api";
import WorkoutShareCard from "@/components/WorkoutShareCard";


export default function WorkoutSuccessPage() {
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [activeCard, setActiveCard] = useState(0);
  const cards: (0 | 1 | 2 | 3)[] = [0, 1, 2];


  useEffect(() => {
    const dataStr = sessionStorage.getItem("lastFinishedWorkout");
    if (!dataStr) {
      // fallback: no data, go home or fetch from API
      router.push("/home");
      return;
    }
    try {
      setWorkout(JSON.parse(dataStr));
    } catch (e) {
      console.error("Error parsing lastFinishedWorkout:", e);
      router.push("/home");
    }
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
      {/* CARD AREA – horizontal scroll */}
      <div className="flex-1 overflow-hidden">
        <div className="w-full h-full flex items-start">
          <div className="w-full overflow-x-auto">
            <div className="flex flex-nowrap gap-15 px-10 pt-6 pb-4 snap-x snap-mandatory">
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
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* Done Button – stays at bottom */}
      <div className="pb-8 px-4">
        <Button
          variant="default"
          onClick={handleDone}
          className="w-full bg-blue-500 hover:bg-blue-600 text-lg font-regular text-white py-6 rounded-[10px]"
        >
          Done
        </Button>
      </div>
    </div>

  );
}

