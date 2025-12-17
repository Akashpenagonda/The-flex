import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem("flexliving-theme");
        return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
        localStorage.setItem("flexliving-theme", isDark ? "dark" : "light");
    }, [isDark]);

    return (
        <button
            className="theme-toggle-navbar"
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Light Mode" : "Dark Mode"}
        >
            {isDark ? "☀️" : "🌙"}
        </button>
    );
}