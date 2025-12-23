'use client';
import { ArrowLeft, ChevronRight, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white relative flex items-center px-4 pt-4 pb-3 border-b border-gray-100">
        
        {/* Back button */}
        <button
          className="p-1 -ml-1"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </button>

        {/* Centered title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-normal">
          Settings
        </h1>

      </div>

      {/* Main Content */}
      <div className="py-4">
        {/* Sound Type Category */}
        <div className="mb-6">
          <h2 className="text-sm font-regular text-gray-400 mb-3 px-4">Account</h2>
          <button
            onClick={() => { router.push("/profile/edit-profile"); }}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex flex-row items-center gap-3">
            <UserRound className="size-6 text-gray-600" />
            <span className="text-sm font-regular text-black">Profile</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronRight className="size-5 text-gray-400" />
            </div>
          </button>
        </div>
        </div>
    </div>
  );
}
