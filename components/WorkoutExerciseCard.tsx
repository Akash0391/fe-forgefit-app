import {
  AlarmClock,
  ChevronDown,
  Dumbbell,
  Plus,
  MoreVertical,
  Clock,
  Check,
  Timer,
  CheckCheck,
  SquareCheck,
} from "lucide-react";
import { Exercise, workoutApi, SetData, authApi } from "@/lib/api";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Workout Exercise Card Component
interface WorkoutExerciseCardProps {
  exercise: Exercise;
  sets: SetData[];
  onSetsChange: (sets: SetData[]) => void;
  onMenuClick: () => void;
  isInSuperset?: boolean;
  isRemoving?: boolean;
  shouldSlideUp?: boolean;
  restTimerSeconds?: number;
  onRestTimerClick: () => void;
  onSetCompleted?: () => void;
}


export function WorkoutExerciseCard({
  exercise,
  sets,
  onSetsChange,
  onMenuClick,
  isInSuperset = false,
  isRemoving = false,
  shouldSlideUp = false,
  restTimerSeconds = 0,
  onRestTimerClick,
  onSetCompleted,
}: WorkoutExerciseCardProps) {
  const [notes, setNotes] = useState("");
  // remove restTimerEnabled state, we derive from restTimerSeconds
  const isRestTimerOn = restTimerSeconds > 0;
  const [restTimerEnabled, setRestTimerEnabled] = useState(isRestTimerOn);

  const handleAddSet = () => {
    onSetsChange([
      ...sets,
      {
        setNumber: sets.length + 1,
        previous: "-",
        kg: 0,
        reps: 0,
        completed: false,
      },
    ]);
  };

  const handleSetChange = (
    index: number,
    field: string,
    value: string | number | boolean
  ) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    onSetsChange(newSets);
  };

  // Format exercise name with equipment in parentheses if available
  const formatExerciseName = () => {
    const name = exercise.name;
    const equipment = exercise.equipment;

    // If equipment is not "bodyweight" and not already in the name, add it
    if (equipment && equipment !== "bodyweight" && equipment !== "other") {
      const equipmentFormatted =
        equipment.charAt(0).toUpperCase() + equipment.slice(1);
      if (!name.toLowerCase().includes(equipment.toLowerCase())) {
        return `${name} (${equipmentFormatted})`;
      }
    }
    return name;
  };

  return (
    <div
      className={`p-2 overflow-hidden ${isRemoving
        ? "opacity-0 max-h-0 mb-0"
        : "opacity-100 max-h-[2000px]"
        }`}
      style={{
        transition: isRemoving
          ? "opacity 300ms ease-in-out, max-height 400ms ease-in-out, margin-bottom 400ms ease-in-out, transform 400ms ease-in-out"
          : "opacity 300ms ease-in-out, max-height 400ms ease-in-out, margin-top 400ms ease-in-out, transform 400ms ease-in-out",
        marginTop: shouldSlideUp ? "-4rem" : undefined,
        transform: shouldSlideUp ? "translateY(0)" : "none",
      }}
    >
      {/* Exercise Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {/* Exercise Image/Icon */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-100">
            {exercise.thumbnailUrl ? (
              <img
                src={exercise.thumbnailUrl}
                alt={exercise.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <Dumbbell className="size-4 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-blue-600 truncate">
              {formatExerciseName()}
            </h3>
          </div>
        </div>

        {/* Options Menu */}
        <button
          onClick={onMenuClick}
          className="flex-shrink-0 hover:bg-gray-100 rounded-full transition-colors"
        >
          <MoreVertical className="size-5 text-gray-600" />
        </button>
      </div>
      {/* Exercise Name */}
      <div className="flex-1 flex-col min-w-0">
        {/* Superset Badge */}
        {isInSuperset && (
          <div className="bg-[#b600fd] text-white text-sm font-regular rounded-[8px] text-center py-0.5 px-5 inline-block">
            Superset
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="mb-4">
        <Input
          placeholder="Add notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full !border-none text-gray-500 placeholder:text-gray-400 text-sm"
        />
      </div>

      {/* Rest Timer Section */}
      <div
        className="flex items-center gap-2 mb-5 mt-5 cursor-pointer hover:opacity-80 transition-opacity active:opacity-70"
        onClick={onRestTimerClick}
      >
        <Timer className="size-5 text-blue-600" />
        <span className="text-sm text-blue-600 font-regular">
          Rest Timer:{" "}
          {isRestTimerOn ? `${restTimerSeconds}s` : "OFF"}
        </span>
      </div>



      {/* Sets Table */}
      <div className="mb-4">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-20 text-sm font-regular text-gray-500 pb-2">
          <div className="text-center">SET</div>
          <div className="text-center">PREVIOUS</div>
          <div className="flex items-center justify-center gap-1">
            <Dumbbell className="size-2" /> 
            KG
          </div>
          <div className="text-center">REPS</div>
          <div className="flex justify-center">
            <Check className="size-4 text-blue-600" />
          </div>
        </div>

        {/* Sets Rows */}
        {sets.map((set, index) => (
          <div
            key={index}
            className={`grid grid-cols-5 gap-20 items-center py-2 border-b border-gray-100 last:border-b-0 rounded transition-colors ${set.completed ? "bg-green-100" : ""
              }`}
          >
            <div
              className={`text-sm font-semibold text-center ${set.completed ? "text-black" : "text-gray-700"
                }`}
            >
              {set.setNumber}
            </div>
            <div
              className={`text-sm font-semibold text-center ${set.completed ? "text-gray-400" : "text-gray-400"
                }`}
            >
              {set.previous}
            </div>
            <div className="flex justify-center">
              <Input
                type="number"
                value={set.kg || ""}
                onChange={(e) =>
                  handleSetChange(index, "kg", parseInt(e.target.value) || 0)
                }
                className={`w-full h-8 px-2 text-sm text-center !border-0 border-none focus:!border-0 focus:border-none focus:ring-0 focus:outline-none shadow-none ${set.completed ? "bg-green-100" : ""
                  }`}
                placeholder="0"
              />
            </div>
            <div className="flex justify-center">
              <Input
                type="number"
                value={set.reps || ""}
                onChange={(e) =>
                  handleSetChange(index, "reps", parseInt(e.target.value) || 0)
                }
                className={`w-full h-8 px-2 text-sm text-center !border-0 border-none focus:!border-0 focus:border-none focus:ring-0 focus:outline-none shadow-none ${set.completed ? "bg-green-100" : ""
                  }`}
                placeholder="0"
              />
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  const newCompleted = !set.completed;
                  handleSetChange(index, "completed", newCompleted);

                  // only fire when changing from NOT completed -> completed
                  if (!set.completed && newCompleted && onSetCompleted) {
                    onSetCompleted();
                  }
                }}
                className="cursor-pointer"
              >
                {set.completed ? (
                  <SquareCheck className="size-5 text-green-600" />
                ) : (
                  <SquareCheck className="size-5 text-gray-300" />
                )}
              </button>

            </div>
          </div>
        ))}
      </div>

      {/* Add Set Button */}
      <Button
        variant="ghost"
        onClick={handleAddSet}
        className="w-full rounded-[10px]  text-gray-700 bg-gray-100 py-2 h-auto text-sm"
      >
        <Plus className="size-4" />
        <span className="text-sm font-regular">Add Set</span>
      </Button>
    </div>
  );
}