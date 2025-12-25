"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExploreRoutinePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-center relative px-4">
        <button
          onClick={() => router.push("/workout")}
          className="absolute left-4"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-sm font-regular">Explore</h1>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center">
        <p className="text-base text-gray-500 text-center px-4">
          Routines will be added soon
        </p>
      </main>
    </div>
  );
}
