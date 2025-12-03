"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SelectExercise() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const items = [
    {
      id: "weight_reps",
      title: "Weight & Reps",
      example: "Example: Bench Press, Dumbbell Curls",
      pills: ["REPS", "KG"],
    },
    {
      id: "bodyweight_reps",
      title: "Bodyweight Reps",
      example: "Example: Pullups, Sit ups, Burpees",
      pills: ["REPS"],
    },
    {
      id: "weighted_bodyweight",
      title: "Weighted Bodyweight",
      example: "Example: Weighted Pull Ups, Weighted Dips",
      pills: ["REPS", "+KG"],
    },
    {
      id: "assisted_bodyweight",
      title: "Assisted Bodyweight",
      example: "Example: Assisted Pullups, Assisted Dips",
      pills: ["REPS", "-KG"],
    },
    {
      id: "duration",
      title: "Duration",
      example: "Example: Planks, Yoga, Stretching",
      pills: ["TIME"],
    },
    {
      id: "duration_weight",
      title: "Duration & Weight",
      example: "Example: Weighted Plank, Wall Sit",
      pills: ["KG", "TIME"],
    },
    {
      id: "distance_duration",
      title: "Distance & Duration",
      example: "Example: Running, Cycling, Rowing",
      pills: ["TIME", "KM"],
    },
    {
      id: "weight_distance",
      title: "Weight & Distance",
      example: "Example: Farmers Walk, Suitcase Carry",
      pills: ["KG", "KM"],
    },
  ];

  const handleSelect = (title: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("exerciseType", title);

    router.push(
      `/workout/quick-start/create-exercise?${params.toString()}`
    );
  };

  return (
    <div className="bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 bg-white z-20 border-b border-gray-100">
        <div className="h-16 flex items-center px-4">
          <button
            aria-label="Back"
            onClick={() => window.history.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <h1 className="flex-1 text-center text-lg font-regular">
            Select Exercise Type
          </h1>

          <div className="w-8" />
        </div>
      </header>

      {/* List */}
      <div className="px-4 pt-8">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.title)}
            className="w-full mb-4 border-b border-gray-100 pb-3 text-left"
          >
            {/* Title */}
            <div className="text-lg text-black font-regular">
              {item.title}
            </div>

            {/* Example text */}
            <div className="text-gray-400 mt-2 text-lg leading-tight">
              {item.example}
            </div>

            {/* Pills */}
            <div className="flex flex-wrap gap-2 mt-2">
              {item.pills.map((p) => (
                <span
                  key={p}
                  className="px-4 py-1 bg-gray-200 rounded-full text-gray-700 text-xm font-medium"
                >
                  {p}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
