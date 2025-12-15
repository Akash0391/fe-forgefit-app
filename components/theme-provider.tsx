"use client";

import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let theme = localStorage.getItem("theme");

    // If no theme exists, set "light" as default
    if (!theme) {
      localStorage.setItem("theme", "light");
      theme = "light";
    }

    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              let theme = localStorage.getItem('theme');
              if (!theme) {
                localStorage.setItem('theme', 'light');
                theme = 'light';
              }
              document.documentElement.classList.toggle('dark', theme === 'dark');
            })();
          `,
        }}
      />
      {children}
    </>
  );
}
