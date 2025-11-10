"use client";

import { RotateCw, Plus, Notebook, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkoutPage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Pro Badge */}
          <div className="flex items-center">
            <span className="px-2 py-0.2 text-lg rounded-full bg-yellow-500 text-gray-600">
              PRO
            </span>
          </div>

          {/* Middle: Workout Title */}
          <h1 className="text-lg font-semibold capitalize">workout</h1>

          {/* Right: Refresh Icon */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-10 w-10"
              aria-label="Refresh page"
            >
              <RotateCw className="size-[20px]" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6 pb-20 mt-0">
        {/* Quick Start Section */}
        <section>
          <h2 className="text-lg font-semibold mb-5">Quick Start</h2>
          <Button
            variant="outline"
            className="w-full justify-start text-lg bg-gray-100 rounded-[10px] p-8"
            size="lg"
          >
            <Plus className="size-[26px]" />{" "}
            <span className="font-regular">Start Empty Workout</span>
          </Button>
        </section>

        {/* Routines Section */}
        <section>
          <h2 className="text-lg font-semibold mb-5">Routines</h2>
          <div className="flex flex-row gap-2">
            <button
              onClick={() => {
                // Handle New Routines click
                console.log("New Routines clicked");
              }}
              className="w-1/2 flex flex-col items-center justify-center bg-gray-100 rounded-[10px] p-8 hover:bg-gray-200 transition-colors cursor-pointer active:scale-95"
            >
              <Notebook className="size-[20px] mb-2" />
              <p className="text-lg font-regular">New Routine</p>
            </button>
            <button
              onClick={() => {
                // Handle Explore routines click
                console.log("Explore routines clicked");
              }}
              className="w-1/2 flex flex-col items-center justify-center bg-gray-100 rounded-[10px] p-8 hover:bg-gray-200 transition-colors cursor-pointer active:scale-95"
            >
              <Search className="size-[20px] mb-2" />
              <p className="text-lg font-regular">Explore routines</p>
            </button>
          </div>
        </section>

        {/* How to get Started Button */}
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-1 md:hidden">
          <Button
            variant="default"
            className="w-full justify-between text-lg bg-blue-100 text-black rounded-[10px] p-9"
            onClick={() => {
              // Handle How to get Started click
              console.log("How to get started clicked");
            }}
          >
            <span className="pl-2 font-regular">How to get started</span>
            <ArrowRight className="size-[20px] mr-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
