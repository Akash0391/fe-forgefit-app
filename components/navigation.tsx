"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    name: "Home",
    href: "/home",
    Icon: Home,
  },
  {
    name: "Workout",
    href: "/workout",
    Icon: Dumbbell,
  },
  {
    name: "Profile",
    href: "/profile",
    Icon: User,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const hideBottomNav = pathname?.includes("/workout/quick-start");

  return (
    <>
      {/* Mobile Bottom Navigation */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
        <div className="flex items-center justify-around h-16">
          {navigationItems.map((item) => {
            const Icon = item.Icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-[24px]" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 md:bg-background md:border-r md:border-border">
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-6 border-b border-border">
            <h1 className="text-xl font-bold">ForgeFit</h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.Icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="size-[20px]" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

