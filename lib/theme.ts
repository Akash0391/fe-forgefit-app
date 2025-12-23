export type ThemeMode = "light" | "dark" | "system";

export function applyTheme(mode: ThemeMode) {
  let finalTheme: "light" | "dark" = "light";

  if (mode === "dark") finalTheme = "dark";
  if (mode === "light") finalTheme = "light";
  if (mode === "system") {
    // You said: system = light
    finalTheme = "light";
  }

  localStorage.setItem("theme", finalTheme);
  document.documentElement.classList.toggle("dark", finalTheme === "dark");
}
