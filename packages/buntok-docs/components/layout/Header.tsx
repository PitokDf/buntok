"use client";

import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Docs" },
  { href: "/benchmarks", label: "Benchmarks" },
];

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isDocs = !!onToggleSidebar;

  const handleToggle = () => {
    if (isDocs) {
      onToggleSidebar!();
    } else {
      setMobileNavOpen(!mobileNavOpen);
    }
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  const menuOpen = isDocs ? isSidebarOpen : mobileNavOpen;

  return (
    <header className="sticky top-0 z-50 w-full h-16 border-b border-border-primary bg-bg-primary/70 backdrop-blur-md supports-backdrop-filter:bg-bg-primary/60 transition-colors duration-200">
      <div className="flex h-full items-center px-4 lg:px-6">
        {/* Mobile hamburger - docs & non-docs share one button */}
        <button
          onClick={handleToggle}
          className={`${isDocs ? "lg:hidden" : "sm:hidden"} p-2 mr-2 rounded-lg hover:bg-bg-tertiary transition-colors`}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <X className="w-5 h-5 text-text-secondary" />
          ) : (
            <Menu className="w-5 h-5 text-text-secondary" />
          )}
        </button>

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0"
        >
          <img
            src={`${import.meta.env.BASE_URL}favicon.ico`}
            alt="Buntok"
            className="w-7 h-7 object-contain"
          />
          <span className="font-bold text-base tracking-tight">Buntok</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1 ml-6 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search trigger - Elysia pill */}
          {pathname.startsWith("/docs") && (
            <button
              onClick={() => {
                window.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
                );
              }}
              className="hidden sm:flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-border-primary bg-bg-secondary text-text-secondary text-xs hover:border-accent/30 hover:bg-accent-muted transition-all"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              Search...
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1 py-0.5 text-[10px] font-mono bg-bg-tertiary border border-border-primary rounded ml-4">
                <span className="text-[9px]">⌘</span>K
              </kbd>
            </button>
          )}
          <Link
            href="https://github.com/PitokDf/buntok"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
            aria-label="GitHub"
          >
            <svg
              className="w-5 h-5 text-text-secondary hover:text-accent"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </Link>
          <div className="w-px h-4 bg-border-primary hidden sm:block" />
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile nav dropdown (non-docs pages only) */}
      {!isDocs && mobileNavOpen && (
        <div className="sm:hidden border-t border-border-primary bg-bg-primary/95 backdrop-blur-md">
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileNav}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-accent-muted text-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
