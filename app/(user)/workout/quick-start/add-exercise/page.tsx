"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, RotateCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddExercisePage() {
  const router = useRouter();
  const handleCreate = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Pro Badge */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
            aria-label="Go back"
          >
            <span className="px-2 py-0.2 text-lg font-regular text-blue-600 ml-5">
              Cancel
            </span>
          </Button>

          {/* Middle: Workout Title */}
          <h1 className="text-lg font-regular capitalize">add exercise</h1>

          {/* Right: Create Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCreate}
            className="h-10 w-10"
            aria-label="Refresh page"
          >
            <span className="text-lg font-regular text-blue-600 mr-5">
              Create
            </span>
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute size-[24px] left-4 top-1/2 transform -translate-y-1/2 size-5 text-gray-400 pointer-events-none z-10" />
          <Input
            placeholder="Search exercise"
            className="w-full h-12 !px-0 !pl-14 !pr-4 text-base rounded-[8px] !bg-gray-100 border-none outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-row items-center gap-5 mt-6">
          <Button 
            variant="default" 
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-black rounded-[8px] py-3 px-4 h-auto"
          >
            <span className="text-base font-regular">All Equipment</span>
          </Button>
          <Button 
            variant="default" 
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-black rounded-[8px] py-3 px-4 h-auto"
          >
            <span className="text-base font-regular">All Muscles</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
