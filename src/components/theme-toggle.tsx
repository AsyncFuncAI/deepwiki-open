"use client";

import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      className="btn-cyberpunk relative group overflow-hidden border border-[var(--border-color)] hover:border-[var(--accent-primary)] p-2 transition-all duration-300 holographic"
      title="Toggle cyberpunk protocol"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {/* Cyberpunk Theme Icons */}
      <div className="relative w-6 h-6">
        {/* Light Mode - Circuit Board Icon */}
        <div className={`absolute inset-0 transition-all duration-500 ${theme === 'dark' ? 'opacity-0 rotate-180 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-[var(--accent-primary)] neon-glow-cyan" aria-label="Light Protocol">
            <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
            <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
            <circle cx="6.5" cy="17.5" r="1.5" fill="currentColor" />
            <circle cx="17.5" cy="17.5" r="1.5" fill="currentColor" />
            <path d="M12 3L12 21" stroke="currentColor" strokeWidth="1" />
            <path d="M3 12L21 12" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        {/* Dark Mode - Neural Network Icon */}
        <div className={`absolute inset-0 transition-all duration-500 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-50'}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-[var(--accent-secondary)] neon-glow-magenta" aria-label="Dark Protocol">
            <circle cx="12" cy="4" r="2" fill="currentColor" />
            <circle cx="20" cy="8" r="2" fill="currentColor" />
            <circle cx="20" cy="16" r="2" fill="currentColor" />
            <circle cx="12" cy="20" r="2" fill="currentColor" />
            <circle cx="4" cy="16" r="2" fill="currentColor" />
            <circle cx="4" cy="8" r="2" fill="currentColor" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />

            {/* Neural connections */}
            <path d="M12 4L4 8" stroke="currentColor" strokeWidth="1" opacity="0.7" />
            <path d="M12 4L20 8" stroke="currentColor" strokeWidth="1" opacity="0.7" />
            <path d="M4 8L4 16" stroke="currentColor" strokeWidth="1" opacity="0.7" />
            <path d="M20 8L20 16" stroke="currentColor" strokeWidth="1" opacity="0.7" />
            <path d="M4 16L12 20" stroke="currentColor" strokeWidth="1" opacity="0.7" />
            <path d="M20 16L12 20" stroke="currentColor" strokeWidth="1" opacity="0.7" />
            <path d="M12 4L12 12" stroke="currentColor" strokeWidth="1" opacity="0.7" />
            <path d="M12 12L12 20" stroke="currentColor" strokeWidth="1" opacity="0.7" />
            <path d="M4 8L12 12" stroke="currentColor" strokeWidth="1" opacity="0.7" />
            <path d="M20 8L12 12" stroke="currentColor" strokeWidth="1" opacity="0.7" />
            <path d="M4 16L12 12" stroke="currentColor" strokeWidth="1" opacity="0.7" />
            <path d="M20 16L12 12" stroke="currentColor" strokeWidth="1" opacity="0.7" />
          </svg>
        </div>
      </div>

      {/* Animated Border Effect */}
      <div className="absolute inset-0 border-2 border-transparent rounded transition-all duration-300 group-hover:border-[var(--accent-primary)] group-hover:neon-glow-cyan">
        <div className="absolute inset-0 rounded animate-pulse opacity-50"></div>
      </div>

      {/* Glitch Effect on Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-[var(--accent-primary)]/20 to-transparent animate-pulse"></div>
      </div>
    </button>
  );
}
