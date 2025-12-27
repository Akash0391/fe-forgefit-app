'use client';
import { ArrowLeft, ChevronRight, Lock, Mail, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 relative flex items-center px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-600">
        
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
          Account Settings
        </h1>

      </div>

      {/* Main Content */}
      <div className="">
        {/* Account Settings */}
        <div className="mb-6">
          <button
            onClick={() => { router.push("/profile/settings/account-settings/change-username"); }}
            className="w-full flex items-center justify-between px-4 py-5 border-b border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-900 transition-colors"
          >
            <div className="flex flex-row items-center gap-3">
            <UserRound className="size-6 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-regular text-black dark:text-white">Change Username</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronRight className="size-5 text-gray-400" />
            </div>
          </button>
          <button
            onClick={() => { router.push("/profile/settings/account-settings/update-password"); }}
            className="w-full flex items-center justify-between px-4 py-5 border-b border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-900 transition-colors"
          >
            <div className="flex flex-row items-center gap-3">
            <Lock className="size-6 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-regular text-black dark:text-white">Update Password</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronRight className="size-5 text-gray-400" />
            </div>
          </button>

          <div className="pb-6 text-center">
            <button
              onClick={() => {}}
              className="mt-10 text-red-500 text-sm font-regular"
            >
              Delete Account
            </button>
          </div>
        </div>
        </div>
    </div>
  );
}
