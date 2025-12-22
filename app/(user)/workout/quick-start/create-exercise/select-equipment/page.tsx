"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCreateExerciseStore } from "@/store/useCreateExerciseStore";

export default function SelectEquipment() {
  const router = useRouter();
  const { equipment, setEquipment } = useCreateExerciseStore();
  const menuItems = [
    { id: "none", label: "None", icon: "/icons/person.png" },
    { id: "barbell", label: "Barbell", icon: "/icons/barbell.png" },
    { id: "dumbell", label: "Dumbell", icon: "/icons/dumbell2.png" },
    { id: "kettlebell", label: "Kettlebell", icon: "/icons/kettlebell.png" },
    { id: "machine", label: "Machine", icon: "/icons/machine.png" },
    { id: "plate", label: "Plate", icon: "/icons/plates.png" },
    { id: "rband", label: "Resistance Band", icon: "/icons/resistance-band.png" },
    { id: "sband", label: "Suspension Band", icon: "/icons/suspension-band.png" },
    { id: "other", label: "Other", icon: "/icons/ellipsis.png" },
  ];

  const handleSelect = (label: string) => {
    // update global create-exercise state
    setEquipment(label);

    // go back to Create Exercise page
    router.push("/workout/quick-start/create-exercise");
    // or router.back(); if you prefer history back
  };

  return (
    <div className="bg-white text-gray-900">
      <header className="sticky top-0 bg-white z-20 border-b border-gray-100">
        <div className="h-16 flex items-center px-4">
          <button
            aria-label="Back"
            className="mr-2 rounded-full"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="size-7 text-gray-700" />
          </button>

          <h1 className="flex-1 text-center text-lg font-regular">
            Select Equipment Type
          </h1>

          <div className="w-7" />
        </div>
      </header>

      <div className="px-1 mt-6 h-full">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSelect(item.label)}
            className="w-full flex items-center gap-4 h-[80px] border-b border-gray-100 px-5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0 overflow-hidden">
              <img
                src={item.icon}
                alt={item.label}
                className="w-12 h-12 object-contain"
              />
            </div>

            <span className="flex-1 text-lg text-gray-800">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
