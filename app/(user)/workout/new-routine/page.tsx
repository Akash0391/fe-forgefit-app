"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewRoutinePage() {
  const [exercises, setExercises] = useState<any[]>([]);
  const router = useRouter();       
  const handleAddExercise = () => {
    // Add exercise logic here - for now, just add a placeholder
    setExercises([...exercises, { id: Date.now(), name: "Exercise" }]);
  };

  const handleSave = () => {
    console.log("Save routine");
    // Add save logic here
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Edit Profile */}
          <button 
          onClick={() => router.back()}
          aria-label="Go back"
          className="text-blue-500 text-lg font-regular">Cancel</button>

          {/* Center: Username */}
          <h1 className="text-lg font-regular">Create Routine</h1>

          {/* Right: Save Button */}
          <Button
            variant="default"
            onClick={handleSave}
            disabled={exercises.length === 0}
            className={`text-lg font-regular ${
              exercises.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            Save
          </Button>
        </div>
      </header>

      <div className="px-4 py-6">
        <Input
          type="text"
          placeholder="Routine title"
          className="text-xl p-8 font-semibold border-none outline-none placeholder:text-gray-400 placeholder:text-lg"
        />
      </div>

      {/* Main Content Area - Get Started or Exercise List */}
      {exercises.length === 0 ? (
        <>
          <div className="flex flex flex-col items-center justify-center px-4 pt-20 pb-2">
            <Dumbbell className="size-[36px] text-gray-300 mb-6 stroke-[1.5]" />
            <p className="text-gray-500 font-regular text-lg text-center">
              Get started by adding an exercise to your routine.
            </p>
          </div>

          {/* Primary Button */}
          <div className="px-4 py-6">
            <Button
              variant="default"
              onClick={handleAddExercise}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg py-6 rounded-[10px]"
            >
              <Plus className="size-[20px] mr-2" />
              Add Exercise
            </Button>
          </div>
        </>
      ) : (
        <div className="px-4 py-6">
          {/* Exercise list would go here */}
          <div className="space-y-4">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="bg-white rounded-[10px] p-4 border border-gray-200"
              >
                <p className="text-lg font-regular">{exercise.name}</p>
              </div>
            ))}
          </div>
          <Button
            variant="default"
            onClick={handleAddExercise}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg py-6 rounded-[10px] mt-4"
          >
            <Plus className="size-[20px] mr-2" />
            Add Exercise
          </Button>
        </div>
      )}
    </div>
  );
}
