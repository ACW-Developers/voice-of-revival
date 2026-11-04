import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    let selected = "dark";
    try { selected = localStorage.getItem("vor-theme") ?? "dark"; } catch { /* Storage may be unavailable. */ }
    setLight(selected === "light");
    document.documentElement.dataset['theme'] = selected === "light" ? "light" : "dark";
  }, []);
  function toggle() {
    const theme = light ? "dark" : "light";
    setLight(!light);
    document.documentElement.dataset['theme'] = theme;
    try { localStorage.setItem("vor-theme", theme); } catch { /* Theme still works without persistence. */ }
  }
  return (
    <Button variant="ghost" className="theme-toggle h-10 w-18 shrink-0 border border-border bg-muted p-1 hover:bg-muted" role="switch" aria-checked={light} aria-label="Light theme" title={light ? "Switch to dark theme" : "Switch to light theme"} onClick={toggle}>
      <Sun className="absolute left-2.5 text-muted-foreground" />
      <Moon className="absolute right-2.5 text-muted-foreground" />
      <span className={`theme-toggle-thumb ${light ? "is-light" : ""}`}>
        {light ? <Sun /> : <Moon />}
      </span>
    </Button>
  );
}