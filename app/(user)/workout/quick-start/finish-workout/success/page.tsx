"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function WorkoutSuccessPage() {
  const router = useRouter();

  const handleDone = () => {
    router.push("/home");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Good Job Message */}
        <h1 className="text-4xl font-bold text-black mb-8 text-center">
          Good Job
        </h1>
      </div>

      {/* Done Button */}
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

