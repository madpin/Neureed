"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
  showConfirmation?: boolean;
}

export function SignOutButton({
  className = "rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted",
  children = "Sign Out",
  showConfirmation = true,
}: SignOutButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSignOut = () => {
    if (showConfirmation && !isConfirming) {
      setIsConfirming(true);
      return;
    }
    signOut({ callbackUrl: "/" });
  };

  const handleCancel = () => {
    setIsConfirming(false);
  };

  if (isConfirming) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleSignOut}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Confirm
        </button>
        <button
          onClick={handleCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleSignOut} className={className}>
      {children}
    </button>
  );
}

