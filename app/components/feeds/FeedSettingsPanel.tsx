"use client";

interface FeedSettingsPanelProps {
  feedId: string;
  feedName: string;
  onClose: () => void;
  onUnsubscribe: (feedId: string) => void;
  onDelete: (feedId: string) => void;
}

export function FeedSettingsPanel({
  feedId,
  feedName,
  onClose,
  onUnsubscribe,
  onDelete,
}: FeedSettingsPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Feed Settings: {feedName}</h2>
        
        <div className="space-y-4">
          <button
            onClick={() => {
              onUnsubscribe(feedId);
              onClose();
            }}
            className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
          >
            Unsubscribe
          </button>
          
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${feedName}?`)) {
                onDelete(feedId);
                onClose();
              }
            }}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
          >
            Delete Feed
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

