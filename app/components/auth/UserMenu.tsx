"use client";

import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { SignInButton, SignInWithGoogleButton, SignInWithGitHubButton } from "./SignInButton";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (status === "loading") {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
    );
  }

  if (!session?.user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Sign In
        </button>

        {isOpen && (
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-border bg-background p-4 shadow-lg">
            <div className="space-y-3">
              <p className="text-sm text-secondary">
                Sign in to access your personalized feed
              </p>
              <SignInWithGoogleButton />
              <SignInWithGitHubButton />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted transition-colors"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
          </div>
        )}
        <svg
          className={`h-4 w-4 text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-border bg-background shadow-lg">
          {/* User Info */}
          <div className="border-b border-border p-4">
            <p className="font-medium text-foreground">
              {session.user.name || "User"}
            </p>
            <p className="text-sm text-secondary">
              {session.user.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <Link
              href="/preferences"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Preferences
            </Link>
            <Link
              href="/preferences/analytics"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Learning Dashboard
            </Link>
            <Link
              href="/admin/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Admin Dashboard
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-border p-2">
            <SignOutButton
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-accent hover:bg-muted"
              showConfirmation={false}
            >
              Sign Out
            </SignOutButton>
          </div>
        </div>
      )}
    </div>
  );
}

