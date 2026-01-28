"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
            className="relative w-9 h-9 rounded-full transition-all duration-300 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
            <Sun
                className={`h-5 w-5 transition-all duration-300 ${theme === "dark" ? "scale-0 rotate-90" : "scale-100 rotate-0"
                    }`}
            />
            <Moon
                className={`absolute h-5 w-5 transition-all duration-300 ${theme === "dark" ? "scale-100 rotate-0" : "scale-0 -rotate-90"
                    }`}
            />
        </Button>
    );
}
