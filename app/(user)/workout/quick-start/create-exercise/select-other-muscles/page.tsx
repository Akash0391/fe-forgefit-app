"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SelectOtherMuscle() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");

  // initialise Set from URL if present
  const [selected, setSelected] = useState<Set<string>>(() => {
    const existing = searchParams.get("otherMuscles");
    if (!existing) return new Set();
    return new Set(existing.split(",").filter(Boolean));
  });

  const menuItems = [
    { id: "arms", label: "Arms", icon: "/icons/arms.png" },
    { id: "back", label: "Back", icon: "/icons/back.png" },
    { id: "chest", label: "Chest", icon: "/icons/chest.png" },
    { id: "core", label: "Core", icon: "/icons/core.png" },
    { id: "cardio", label: "Cardio", icon: "/icons/cardio.png" },
    { id: "legs", label: "Legs", icon: "/icons/legs.png" },
    { id: "shoulders", label: "Shoulders", icon: "/icons/shoulder.png" },
    { id: "other", label: "Other", icon: "/icons/ellipsis.png" },
  ];

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter((m) => m.label.toLowerCase().includes(q));
  }, [searchQuery]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUpdate = () => {
  // ids → labels using menuItems
  const selectedLabels = Array.from(selected).map((id) => {
    const item = menuItems.find((m) => m.id === id);
    return item ? item.label : id;
  });

  const params = new URLSearchParams(searchParams.toString());
  // use labels, nicely formatted
  params.set("otherMuscles", selectedLabels.join(", "));

  router.push(
    `/workout/quick-start/create-exercise?${params.toString()}`
  );
};


  return (
    <div className="bg-white text-gray-900 relative pb-28">
      {/* Header */}
      <header className="sticky top-0 bg-white z-20 border-b border-gray-100">
        <div className="h-16 flex items-center px-2">
          <button
            aria-label="Back"
            className="mr-2 rounded-full p-2 hover:bg-gray-50"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="size-7 text-gray-700" />
          </button>

          <h1 className="flex-1 text-center text-lg font-regular">
            Secondary Muscle Groups
          </h1>
          <div className="w-7" />
        </div>
      </header>

      {/* Search */}
      <div className="flex-shrink-0 p-4 space-y-4 bg-white">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
          <Input
            placeholder="Search muscle"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchQuery("");
            }}
            className="w-full h-12 pl-14 pr-4 text-lg rounded-[8px] bg-gray-100 border-none outline-none placeholder:text-gray-400 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="px-1 mt-2">
        {filtered.map((item) => {
          const isChecked = selected.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className="w-full flex items-center gap-4 h-[80px] border-b border-gray-100 px-5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
              type="button"
              aria-pressed={isChecked}
            >
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0 overflow-hidden">
                <img
                  src={item.icon}
                  alt={item.label}
                  className="w-12 h-12 object-contain"
                />
              </div>

              <span className="flex-1 text-lg text-gray-800">{item.label}</span>

              <div className="flex items-center gap-4">
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-[5px] border ${
                    isChecked
                      ? "bg-blue-600 border-transparent"
                      : "bg-white border-gray-200"
                  }`}
                  aria-hidden
                >
                  {isChecked ? (
                    <Check className="size-7 text-white" />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Update button */}
      {selected.size > 0 && (
        <div className="fixed left-0 right-0 bottom-10 px-4">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleUpdate}
              className="w-full bg-blue-500 text-white py-3 rounded-[10px] text-lg font-medium shadow-md hover:bg-blue-700 transition-colors"
            >
              Update Muscle Group(s)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
