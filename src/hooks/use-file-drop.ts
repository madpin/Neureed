import { useState, useCallback } from 'react';

export interface UseFileDropOptions {
  /**
   * Accepted file extensions (e.g., ['.opml', '.xml'])
   */
  accept: string[];

  /**
   * Maximum file size in bytes
   */
  maxSize: number;

  /**
   * Custom error messages
   */
  errorMessages?: {
    invalidType?: string;
    sizeTooLarge?: string;
  };

  /**
   * Callback when a valid file is selected
   */
  onFileSelect?: (file: File) => void;

  /**
   * Callback when validation fails
   */
  onError?: (error: string) => void;
}

export interface UseFileDropReturn {
  /**
   * Currently selected file
   */
  file: File | null;

  /**
   * Whether user is currently dragging over the drop zone
   */
  isDragging: boolean;

  /**
   * Validation error message
   */
  error: string | null;

  /**
   * Handle drag events (dragenter, dragover, dragleave)
   */
  handleDrag: (e: React.DragEvent) => void;

  /**
   * Handle drop event
   */
  handleDrop: (e: React.DragEvent) => void;

  /**
   * Reset file and error state
   */
  reset: () => void;
}

/**
 * Hook for handling file drag-and-drop with validation.
 * Supports file type and size validation.
 *
 * @example
 * ```tsx
 * const { file, isDragging, error, handleDrag, handleDrop, reset } = useFileDrop({
 *   accept: ['.opml', '.xml'],
 *   maxSize: 10 * 1024 * 1024, // 10MB
 *   onFileSelect: (file) => console.log('Selected:', file.name),
 *   errorMessages: {
 *     invalidType: 'Please select a valid OPML or XML file',
 *     sizeTooLarge: 'File size exceeds 10MB limit',
 *   },
 * });
 *
 * return (
 *   <div
 *     onDragEnter={handleDrag}
 *     onDragLeave={handleDrag}
 *     onDragOver={handleDrag}
 *     onDrop={handleDrop}
 *     className={isDragging ? 'border-primary' : 'border-gray-300'}
 *   >
 *     {file ? (
 *       <div>
 *         <p>{file.name}</p>
 *         <button onClick={reset}>Remove</button>
 *       </div>
 *     ) : (
 *       <p>Drag and drop a file here</p>
 *     )}
 *     {error && <p className="error">{error}</p>}
 *   </div>
 * );
 * ```
 */
export function useFileDrop(options: UseFileDropOptions): UseFileDropReturn {
  const { accept, maxSize, errorMessages, onFileSelect, onError } = options;

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate file type and size
   */
  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file extension (case-insensitive)
      const hasValidExtension = accept.some((ext) =>
        file.name.toLowerCase().endsWith(ext.toLowerCase())
      );

      if (!hasValidExtension) {
        return (
          errorMessages?.invalidType ||
          `Please select a valid file (${accept.join(', ')})`
        );
      }

      // Check file size
      if (file.size > maxSize) {
        return (
          errorMessages?.sizeTooLarge ||
          `File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`
        );
      }

      return null;
    },
    [accept, maxSize, errorMessages]
  );

  /**
   * Handle drag events (dragenter, dragover, dragleave)
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  /**
   * Handle drop event
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      // Check if files were dropped
      if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) {
        return;
      }

      const droppedFile = e.dataTransfer.files[0];

      // Check if file exists
      if (!droppedFile) {
        return;
      }

      // Validate file
      const validationError = validateFile(droppedFile);

      if (validationError) {
        setError(validationError);
        setFile(null);
        if (onError) {
          onError(validationError);
        }
        return;
      }

      // File is valid
      setFile(droppedFile);
      setError(null);

      if (onFileSelect) {
        onFileSelect(droppedFile);
      }
    },
    [validateFile, onFileSelect, onError]
  );

  /**
   * Reset file and error state
   */
  const reset = useCallback(() => {
    setFile(null);
    setError(null);
  }, []);

  return {
    file,
    isDragging,
    error,
    handleDrag,
    handleDrop,
    reset,
  };
}
