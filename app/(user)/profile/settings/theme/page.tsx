'use client';
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ThemeModal from "@/components/ThemeModal";
import { applyTheme, ThemeMode } from "@/lib/theme";

export default function ThemePage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("light");

  const handleSelect = (mode: ThemeMode) => {
    applyTheme(mode);
    setCurrentTheme(mode);
    setOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 relative flex items-center px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-600">
        <button onClick={() => router.back()} className="p-1 -ml-1">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm">
          Theme
        </h1>
      </div>

      {/* CONTENT */}
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-white dark:bg-gray-900 flex justify-between px-4 py-4"
      >
        <span className="text-sm">Theme</span>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-500 capitalize">
            {currentTheme}
          </span>
          <ChevronRight className="size-5 text-gray-400" />
        </div>
      </button>

      <ThemeModal
        open={open}
        onClose={() => setOpen(false)}
        onDark={() => handleSelect("dark")}
        onLight={() => handleSelect("light")}
        onSystem={() => handleSelect("system")}
      />
    </div>
  );
}
