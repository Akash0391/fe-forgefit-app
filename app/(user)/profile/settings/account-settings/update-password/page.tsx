'use client';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Lock, Mail, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
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
          Update Password
        </h1>

      </div>

      {/* Main Content */}
      <div className="">

        <div className="p-4 bg-white">
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-600 mb-3">
              Password
            </label>
            <input
              type="text"
              id="password"
              className="w-full py-2 mb-4 px-1 border-none rounded-md focus:outline-none text-sm"
              placeholder="(minimum 6 characters)"
            />
          </div>
          <Button className="w-full bg-blue-500 text-white py-6 px-4 rounded-md hover:bg-blue-600 rounded-[10px]">
            Update
          </Button>
        </div>
      </div>
    </div>
  );
}
