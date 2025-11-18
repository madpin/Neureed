"use client";

import { useState } from "react";

/**
 * Cookie extraction guide component
 * Provides step-by-step instructions for extracting cookies from browsers
 */
export function CookieGuide() {
  const [selectedBrowser, setSelectedBrowser] = useState<"chrome" | "firefox" | "safari">("chrome");

  const chromeInstructions = `// 1. Open the website and log in
// 2. Open DevTools (F12 or Cmd+Option+I)
// 3. Go to Console tab
// 4. Paste this code and press Enter:

document.cookie.split(';').map(c => {
  const [name, ...rest] = c.trim().split('=');
  return { name, value: rest.join('=') };
});

// 5. Copy the output (right-click > Copy object)
// 6. Paste it into the cookies field below`;

  const firefoxInstructions = `// 1. Open the website and log in
// 2. Open Web Console (F12 or Cmd+Option+K)
// 3. Go to Console tab
// 4. Paste this code and press Enter:

document.cookie.split(';').map(c => {
  const [name, ...rest] = c.trim().split('=');
  return { name, value: rest.join('=') };
});

// 5. Copy the output (right-click > Copy object)
// 6. Paste it into the cookies field below`;

  const safariInstructions = `// 1. Enable Developer menu (Preferences > Advanced > Show Develop menu)
// 2. Open the website and log in
// 3. Open Web Inspector (Cmd+Option+I)
// 4. Go to Console tab
// 5. Paste this code and press Enter:

document.cookie.split(';').map(c => {
  const [name, ...rest] = c.trim().split('=');
  return { name, value: rest.join('=') };
});

// 6. Copy the output (right-click > Copy)
// 7. Paste it into the cookies field below`;

  const getInstructions = () => {
    switch (selectedBrowser) {
      case "chrome":
        return chromeInstructions;
      case "firefox":
        return firefoxInstructions;
      case "safari":
        return safariInstructions;
    }
  };

  const copyToClipboard = (text: string) => {
    const code = text
      .split("\n")
      .filter((line) => !line.startsWith("//"))
      .join("\n")
      .trim();
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">How to Extract Cookies</h3>
        <p className="text-xs text-foreground/70">
          Follow these steps to extract cookies from your browser for authenticated content access.
        </p>
      </div>

      {/* Browser selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedBrowser("chrome")}
          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
            selectedBrowser === "chrome"
              ? "bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-100"
              : "border-border hover:bg-muted border-border dark:hover:bg-gray-800"
          }`}
        >
          Chrome
        </button>
        <button
          onClick={() => setSelectedBrowser("firefox")}
          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
            selectedBrowser === "firefox"
              ? "bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-100"
              : "border-border hover:bg-muted border-border dark:hover:bg-gray-800"
          }`}
        >
          Firefox
        </button>
        <button
          onClick={() => setSelectedBrowser("safari")}
          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
            selectedBrowser === "safari"
              ? "bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-100"
              : "border-border hover:bg-muted border-border dark:hover:bg-gray-800"
          }`}
        >
          Safari
        </button>
      </div>

      {/* Instructions */}
      <div className="relative">
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
          {getInstructions()}
        </pre>
        <button
          onClick={() => copyToClipboard(getInstructions())}
          className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
        >
          Copy Code
        </button>
      </div>

      {/* Supported formats */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <h4 className="text-xs font-semibold mb-2 text-blue-900 dark:text-blue-100">
          Supported Cookie Formats
        </h4>
        <ul className="text-xs space-y-1 text-blue-800 dark:text-blue-200">
          <li>• JSON array: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">[{"{name: 'session', value: '...'}"}]</code></li>
          <li>• Header string: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">session=...; token=...</code></li>
          <li>• Key=value pairs (one per line)</li>
          <li>• Netscape format (tab-separated)</li>
        </ul>
      </div>

      {/* Security warning */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
        <h4 className="text-xs font-semibold mb-1 text-yellow-900 dark:text-yellow-100 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Security Notice
        </h4>
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          Cookies are stored encrypted in the database. Never share your cookies with others. 
          Cookies may expire and need to be updated periodically.
        </p>
      </div>

      {/* Tips */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold">Tips</h4>
        <ul className="text-xs space-y-1 text-foreground/70">
          <li>• Make sure you're logged in before extracting cookies</li>
          <li>• Test the extraction after saving to verify it works</li>
          <li>• Update cookies if you see authentication errors</li>
          <li>• Some sites require specific cookies - include all of them</li>
        </ul>
      </div>
    </div>
  );
}

