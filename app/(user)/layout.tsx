import { Navigation } from "@/components/navigation";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      {/* Main content area */}
      <main className="flex-1 md:ml-64 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}

