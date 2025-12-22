"use client";

import { ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="relative flex items-center h-16 border-b border-border bg-background">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="h-10 px-4 hover:bg-transparent absolute left-0"
          aria-label="Go back"
        >
          <ArrowLeft className="size-6" />
        </Button>

        {/* Center title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-gray-500">
          Notifications
        </h1>
      </header>

      {/* Empty state */}
      <main className="flex-1 flex flex-col items-center mt-15 text-center px-8">
        <Bell className="w-16 h-16 mb-6 stroke-[1.5] text-muted-foreground" />
        <h2 className="text-sm font-semibold mb-1">
          No recent notifications
        </h2>
        <p className="text-sm text-gray-500 text-regular">
          We&apos;ll notify you when you have new activity
        </p>
      </main>
    </div>
  );
}
