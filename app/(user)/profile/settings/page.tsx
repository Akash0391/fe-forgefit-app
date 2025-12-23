'use client';
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* HEADER */}
      <div className="relative flex items-center px-4 pt-4 pb-3 border-b border-gray-100">
        
        {/* Back button */}
        <button
          className="p-1 -ml-1"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ArrowLeft className="size-6" />
        </button>

        {/* Centered title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-normal">
          Settings
        </h1>

      </div>
    </div>
  );
}
