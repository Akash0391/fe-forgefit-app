"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SelectExercise() {
  const router = useRouter();

  const items = [
    {
      title: "Weight & Reps",
      example: "Example: Bench Press, Dumbbell Curls",
      pills: ["REPS", "KG"],
    },
    {
      title: "Bodyweight Reps",
      example: "Example: Pullups, Sit ups, Burpees",
      pills: ["REPS"]
    },
    {
      title: "Weighted Bodyweight",
      example: "Example: Weighted Pull Ups, Weighted Dips",
      pills: ["REPS", "+KG"],
    },
    {
      title: "Assisted Bodyweight",
      example: "Example: Assisted Pullups, Assisted Dips",
      pills: ["REPS", "-KG"],
    },
    {
      title: "Duration",
      example: "Example: Planks, Yoga, Stretching",
      pills: ["TIME"],
    },
    {
      title: "Duration & Weight",
      example: "Example: Weighted Plank, Wall Sit",
      pills: ["KG", "TIME"],
    },
    {
      title: "Distance & Duration",
      example: "Example: Running, Cycling, Rowing",
      pills: ["TIME", "KM"],
    },
    {
      title: "Weight & Distance",
      example: "Example: Farmers Walk, Suitcase Carry",
      pills: ["KG", "KM"],
    },
  ];

  return (
    <div className="bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 bg-white z-20 border-b border-gray-100">
        <div className="h-16 flex items-center px-4">
          <button
            aria-label="Back"
            onClick={() => router.back()}
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
        {items.map((item, idx) => (
          <div key={idx} className="mb-4 border-b border-gray-100 pb-3">
            {/* Title */}
            <div
              className="text-lg text-black font-regular"
            >
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
          </div>
        ))}
      </div>
    </div>
  );
}
