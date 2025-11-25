"use client";

import { useState } from "react";

interface IconPickerProps {
  currentIcon?: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

const PREDEFINED_ICONS = [
  { icon: "📁", label: "Folder" },
  { icon: "📰", label: "News" },
  { icon: "💻", label: "Tech" },
  { icon: "🎮", label: "Gaming" },
  { icon: "🏀", label: "Sports" },
  { icon: "💼", label: "Business" },
  { icon: "🎨", label: "Design" },
  { icon: "🔬", label: "Science" },
  { icon: "📚", label: "Books" },
  { icon: "🎵", label: "Music" },
  { icon: "🎬", label: "Movies" },
  { icon: "🍔", label: "Food" },
  { icon: "✈️", label: "Travel" },
  { icon: "💪", label: "Health" },
  { icon: "💰", label: "Finance" },
  { icon: "🌍", label: "World" },
  { icon: "⚽", label: "Soccer" },
  { icon: "🎯", label: "Goals" },
  { icon: "🚀", label: "Startup" },
  { icon: "📱", label: "Mobile" },
  { icon: "🔒", label: "Security" },
  { icon: "🌟", label: "Featured" },
  { icon: "📊", label: "Analytics" },
  { icon: "🎓", label: "Education" },
  { icon: "🏠", label: "Home" },
  { icon: "🔧", label: "Tools" },
  { icon: "💡", label: "Ideas" },
  { icon: "🎪", label: "Entertainment" },
  { icon: "🌱", label: "Environment" },
  { icon: "⚡", label: "Energy" },
];

const EMOJI_CATEGORIES = {
  "Smileys & People": [
    "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂",
    "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋",
    "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳",
  ],
  "Animals & Nature": [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
    "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆",
    "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋",
  ],
  "Food & Drink": [
    "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
    "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑",
    "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠",
  ],
  "Activities & Sports": [
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱",
    "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁",
    "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️",
  ],
  "Travel & Places": [
    "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐",
    "🛻", "🚚", "🚛", "🚜", "🦯", "🦽", "🦼", "🛴", "🚲", "🛵",
    "🏍️", "🛺", "🚨", "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟",
  ],
  "Objects": [
    "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️",
    "🗜️", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️",
    "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️",
  ],
  "Symbols": [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
    "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "⭐", "🌟",
    "✨", "⚡", "💥", "💫", "💢", "💦", "💨", "🕊️", "🔥", "💯",
  ],
};

export function IconPicker({ currentIcon, onSelect, onClose }: IconPickerProps) {
  const [activeTab, setActiveTab] = useState<"predefined" | "emoji">("predefined");
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<string>(
    Object.keys(EMOJI_CATEGORIES)[0] || "people"
  );
  const [customEmoji, setCustomEmoji] = useState("");

  const handleSelect = (icon: string) => {
    onSelect(icon);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Choose an Icon</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-muted"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("predefined")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "predefined"
                ? "border-b-2 border-primary text-primary"
                : "text-secondary hover:text-foreground"
            }`}
          >
            Predefined
          </button>
          <button
            onClick={() => setActiveTab("emoji")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "emoji"
                ? "border-b-2 border-primary text-primary"
                : "text-secondary hover:text-foreground"
            }`}
          >
            Emoji
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {activeTab === "predefined" && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {PREDEFINED_ICONS.map(({ icon, label }) => (
                <button
                  key={icon}
                  onClick={() => handleSelect(icon)}
                  className={`flex h-14 w-14 items-center justify-center rounded-lg text-2xl transition-colors hover:bg-muted ${
                    currentIcon === icon ? "bg-accent/20 ring-2 ring-primary" : ""
                  }`}
                  title={label}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}

          {activeTab === "emoji" && (
            <div>
              {/* Emoji Category Tabs */}
              <div className="mb-3 flex flex-wrap gap-2">
                {Object.keys(EMOJI_CATEGORIES).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedEmojiCategory(category)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedEmojiCategory === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-secondary hover:bg-muted/80"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Emoji Grid */}
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1">
                {EMOJI_CATEGORIES[selectedEmojiCategory as keyof typeof EMOJI_CATEGORIES].map(
                  (emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSelect(emoji)}
                      className={`flex h-10 w-10 items-center justify-center rounded text-xl transition-colors hover:bg-muted ${
                        currentIcon === emoji ? "bg-accent/20 ring-2 ring-primary" : ""
                      }`}
                    >
                      {emoji}
                    </button>
                  )
                )}
              </div>

              {/* Custom Emoji Input */}
              <div className="mt-4 border-t border-border pt-4">
                <label className="mb-2 block text-sm font-medium">
                  Or paste any emoji:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    placeholder="Paste emoji here..."
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength={2}
                  />
                  <button
                    onClick={() => {
                      if (customEmoji.trim()) {
                        handleSelect(customEmoji.trim());
                      }
                    }}
                    disabled={!customEmoji.trim()}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Selection */}
        {currentIcon && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
            <span className="text-sm text-secondary">Current icon:</span>
            <span className="text-2xl">{currentIcon}</span>
          </div>
        )}
      </div>
    </div>
  );
}

