import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileDrop } from '../../src/hooks/use-file-drop';

// Helper to create mock File
const createMockFile = (name: string, size: number, type: string = 'text/xml') => {
  const file = new File(['content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Helper to create drag event
const createDragEvent = (type: string, files?: File[]) => {
  const event = new Event(type, { bubbles: true }) as any;
  event.preventDefault = vi.fn();
  event.stopPropagation = vi.fn();
  event.dataTransfer = {
    files: files || [],
  };
  return event as React.DragEvent;
};

describe('useFileDrop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with no file and not dragging', () => {
    const { result } = renderHook(() =>
      useFileDrop({
        accept: ['.opml', '.xml'],
        maxSize: 10 * 1024 * 1024,
      })
    );

    expect(result.current.file).toBeNull();
    expect(result.current.isDragging).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set isDragging to true on dragenter', () => {
    const { result } = renderHook(() =>
      useFileDrop({
        accept: ['.opml', '.xml'],
        maxSize: 10 * 1024 * 1024,
      })
    );

    const event = createDragEvent('dragenter');

    act(() => {
      result.current.handleDrag(event);
    });

    expect(result.current.isDragging).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('should set isDragging to true on dragover', () => {
    const { result } = renderHook(() =>
      useFileDrop({
        accept: ['.opml', '.xml'],
        maxSize: 10 * 1024 * 1024,
      })
    );

    const event = createDragEvent('dragover');

    act(() => {
      result.current.handleDrag(event);
    });

    expect(result.current.isDragging).toBe(true);
  });

  it('should set isDragging to false on dragleave', () => {
    const { result } = renderHook(() =>
      useFileDrop({
        accept: ['.opml', '.xml'],
        maxSize: 10 * 1024 * 1024,
      })
    );

    // First dragenter
    act(() => {
      result.current.handleDrag(createDragEvent('dragenter'));
    });

    expect(result.current.isDragging).toBe(true);

    // Then dragleave
    act(() => {
      result.current.handleDrag(createDragEvent('dragleave'));
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('should handle file drop with valid file', () => {
    const onFileSelect = vi.fn();
    const { result } = renderHook(() =>
      useFileDrop({
        accept: ['.opml', '.xml'],
        maxSize: 10 * 1024 * 1024,
        onFileSelect,
      })
    );

    const file = createMockFile('test.opml', 1024);
    const event = createDragEvent('drop', [file]);

    act(() => {
      result.current.handleDrop(event);
    });

    expect(result.current.file).toBe(file);
    expect(result.current.isDragging).toBe(false);
    expect(result.current.error).toBeNull();
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('should reject file with invalid extension', () => {
    const onFileSelect = vi.fn();
    const { result } = renderHook(() =>
      useFileDrop({
        accept: ['.opml', '.xml'],
        maxSize: 10 * 1024 * 1024,
        onFileSelect,
      })
    );

    const file = createMockFile('test.txt', 1024);
    const event = createDragEvent('drop', [file]);

    act(() => {
      result.current.handleDrop(event);
    });

    expect(result.current.file).toBeNull();
    expect(result.current.error).toContain('valid');
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('should reject file exceeding max size', () => {
    const { result } = renderHook(() =>
      useFileDrop({
        accept: ['.opml', '.xml'],
        maxSize: 1024, // 1KB max
      })
    );

    const file = createMockFile('large.opml', 2048); // 2KB
    const event = createDragEvent('drop', [file]);

    act(() => {
      result.current.handleDrop(event);
    });

    expect(result.current.file).toBeNull();
    expect(result.current.error).toContain('size');
  });

  it('should handle multiple accepted extensions', () => {
    const { result } = renderHook(() =>
      useFileDrop({
        accept: ['.opml', '.xml', '.json'],
        maxSize: 10 * 1024 * 1024,
      })
    );

    const opmlFile = createMockFile('test.opml', 1024);
    act(() => {
      result.current.handleDrop(createDragEvent('drop', [opmlFile]));
    });
    expect(result.current.file).toBe(opmlFile);
    expect(result.current.error).toBeNull();

    const xmlFile = createMockFile('test.xml', 1024);
    act(() => {
      result.current.handleDrop(createDragEvent('drop', [xmlFile]));
    });
    expect(result.current.file).toBe(xmlFile);
    expect(result.current.error).toBeNull();

    const jsonFile = createMockFile('test.json', 1024);
    act(() => {
      result.current.handleDrop(createDragEvent('drop', [jsonFile]));
    });
    expect(result.current.file).toBe(jsonFile);
    expect(result.current.error).toBeNull();
  });

  it('should clear file and error on reset', () => {
    const { result } = renderHook(() =>
      useFileDrop({
        accept: ['.opml', '.xml'],
        maxSize: 10 * 1024 * 1024,
      })
    );

    const file = createMockFile('test.opml', 1024);

    act(() => {
      result.current.handleDrop(createDragEvent('drop', [file]));
    });

    expect(result.current.file).toBe(file);

    act(() => {
      result.current.reset();
    });

    expect(result.current.file).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle drop with no files', () => {
    const { result } = renderHook(() =>
      useFileDrop({
        accept: ['.opml', '.xml'],
        maxSize: 10 * 1024 * 1024,
      })
    );

    const event = createDragEvent('drop', []);

    act(() => {
      result.current.handleDrop(event);
    });

    expect(result.current.file).toBeNull();
    expect(result.current.isDragging).toBe(false);
  });

  it('should use custom error messages', () => {
    const { result } = renderHook(() =>
      useFileDrop({
        accept: ['.opml'],
        maxSize: 1024,
        errorMessages: {
          invalidType: 'Custom type error',
          sizeTooLarge: 'Custom size error',
        },
      })
    );

    // Test invalid type
    const txtFile = createMockFile('test.txt', 512);
    act(() => {
      result.current.handleDrop(createDragEvent('drop', [txtFile]));
    });
    expect(result.current.error).toBe('Custom type error');

    // Test size too large
    const largeFile = createMockFile('large.opml', 2048);
    act(() => {
      result.current.handleDrop(createDragEvent('drop', [largeFile]));
    });
    expect(result.current.error).toBe('Custom size error');
  });

  it('should handle case-insensitive file extensions', () => {
    const { result } = renderHook(() =>
      useFileDrop({
        accept: ['.opml', '.xml'],
        maxSize: 10 * 1024 * 1024,
      })
    );

    const file1 = createMockFile('test.OPML', 1024);
    act(() => {
      result.current.handleDrop(createDragEvent('drop', [file1]));
    });
    expect(result.current.file).toBe(file1);
    expect(result.current.error).toBeNull();

    const file2 = createMockFile('test.Xml', 1024);
    act(() => {
      result.current.handleDrop(createDragEvent('drop', [file2]));
    });
    expect(result.current.file).toBe(file2);
    expect(result.current.error).toBeNull();
  });

  it('should call onError callback when validation fails', () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useFileDrop({
        accept: ['.opml'],
        maxSize: 1024,
        onError,
      })
    );

    const invalidFile = createMockFile('test.txt', 512);
    act(() => {
      result.current.handleDrop(createDragEvent('drop', [invalidFile]));
    });

    expect(onError).toHaveBeenCalledWith(expect.any(String));
  });

  it('should clear previous error on successful file selection', () => {
    const { result } = renderHook(() =>
      useFileDrop({
        accept: ['.opml'],
        maxSize: 10 * 1024 * 1024,
      })
    );

    // First, trigger an error
    const invalidFile = createMockFile('test.txt', 1024);
    act(() => {
      result.current.handleDrop(createDragEvent('drop', [invalidFile]));
    });
    expect(result.current.error).not.toBeNull();

    // Then, select a valid file
    const validFile = createMockFile('test.opml', 1024);
    act(() => {
      result.current.handleDrop(createDragEvent('drop', [validFile]));
    });
    expect(result.current.error).toBeNull();
    expect(result.current.file).toBe(validFile);
  });
});
