import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormChanges } from '../../src/hooks/use-form-changes';

describe('useFormChanges', () => {
  const defaultValues = {
    name: 'John',
    age: 30,
    email: 'john@example.com',
    isActive: true,
  };

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFormChanges(defaultValues));

    expect(result.current.values).toEqual(defaultValues);
    expect(result.current.modifiedFields.size).toBe(0);
    expect(result.current.hasChanges).toBe(false);
  });

  it('should update a field and mark it as modified', () => {
    const { result } = renderHook(() => useFormChanges(defaultValues));

    act(() => {
      result.current.updateField('name', 'Jane');
    });

    expect(result.current.values.name).toBe('Jane');
    expect(result.current.modifiedFields.has('name')).toBe(true);
    expect(result.current.modifiedFields.size).toBe(1);
    expect(result.current.hasChanges).toBe(true);
  });

  it('should update multiple fields independently', () => {
    const { result } = renderHook(() => useFormChanges(defaultValues));

    act(() => {
      result.current.updateField('name', 'Jane');
      result.current.updateField('age', 25);
      result.current.updateField('email', 'jane@example.com');
    });

    expect(result.current.values).toEqual({
      name: 'Jane',
      age: 25,
      email: 'jane@example.com',
      isActive: true,
    });
    expect(result.current.modifiedFields.size).toBe(3);
    expect(result.current.modifiedFields.has('name')).toBe(true);
    expect(result.current.modifiedFields.has('age')).toBe(true);
    expect(result.current.modifiedFields.has('email')).toBe(true);
    expect(result.current.hasChanges).toBe(true);
  });

  it('should reset a field to default value', () => {
    const { result } = renderHook(() => useFormChanges(defaultValues));

    act(() => {
      result.current.updateField('name', 'Jane');
      result.current.updateField('age', 25);
    });

    expect(result.current.modifiedFields.size).toBe(2);

    act(() => {
      result.current.resetField('name');
    });

    expect(result.current.values.name).toBe('John'); // Back to default
    expect(result.current.values.age).toBe(25); // Still modified
    expect(result.current.modifiedFields.has('name')).toBe(false);
    expect(result.current.modifiedFields.has('age')).toBe(true);
    expect(result.current.modifiedFields.size).toBe(1);
    expect(result.current.hasChanges).toBe(true); // Still has changes (age)
  });

  it('should reset all modified fields', () => {
    const { result } = renderHook(() => useFormChanges(defaultValues));

    act(() => {
      result.current.updateField('name', 'Jane');
      result.current.updateField('age', 25);
      result.current.updateField('email', 'jane@example.com');
    });

    expect(result.current.modifiedFields.size).toBe(3);

    act(() => {
      result.current.resetAll();
    });

    expect(result.current.values).toEqual(defaultValues);
    expect(result.current.modifiedFields.size).toBe(0);
    expect(result.current.hasChanges).toBe(false);
  });

  it('should return only changed values', () => {
    const { result } = renderHook(() => useFormChanges(defaultValues));

    act(() => {
      result.current.updateField('name', 'Jane');
      result.current.updateField('age', 25);
    });

    const changedValues = result.current.getChangedValues();

    expect(changedValues).toEqual({
      name: 'Jane',
      age: 25,
    });
    expect(changedValues).not.toHaveProperty('email');
    expect(changedValues).not.toHaveProperty('isActive');
  });

  it('should return empty object when no changes', () => {
    const { result } = renderHook(() => useFormChanges(defaultValues));

    const changedValues = result.current.getChangedValues();

    expect(changedValues).toEqual({});
  });

  it('should handle boolean field updates', () => {
    const { result } = renderHook(() => useFormChanges(defaultValues));

    act(() => {
      result.current.updateField('isActive', false);
    });

    expect(result.current.values.isActive).toBe(false);
    expect(result.current.modifiedFields.has('isActive')).toBe(true);
  });

  it('should handle updating field back to default (should still mark as modified)', () => {
    const { result } = renderHook(() => useFormChanges(defaultValues));

    act(() => {
      result.current.updateField('name', 'Jane');
    });

    expect(result.current.modifiedFields.has('name')).toBe(true);

    // Update back to default value manually
    act(() => {
      result.current.updateField('name', 'John');
    });

    // Should still be marked as modified (user explicitly changed it)
    expect(result.current.modifiedFields.has('name')).toBe(true);
    expect(result.current.values.name).toBe('John');
  });

  it('should support complex types (objects)', () => {
    const complexDefaults = {
      user: { id: 1, name: 'John' },
      settings: { theme: 'dark', notifications: true },
    };

    const { result } = renderHook(() => useFormChanges(complexDefaults));

    act(() => {
      result.current.updateField('user', { id: 2, name: 'Jane' });
    });

    expect(result.current.values.user).toEqual({ id: 2, name: 'Jane' });
    expect(result.current.modifiedFields.has('user')).toBe(true);

    act(() => {
      result.current.resetField('user');
    });

    expect(result.current.values.user).toEqual({ id: 1, name: 'John' });
    expect(result.current.modifiedFields.has('user')).toBe(false);
  });

  it('should work with arrays', () => {
    const defaults = {
      tags: ['react', 'typescript'],
      counts: [1, 2, 3],
    };

    const { result } = renderHook(() => useFormChanges(defaults));

    act(() => {
      result.current.updateField('tags', ['vue', 'javascript']);
    });

    expect(result.current.values.tags).toEqual(['vue', 'javascript']);
    expect(result.current.modifiedFields.has('tags')).toBe(true);

    const changed = result.current.getChangedValues();
    expect(changed).toEqual({
      tags: ['vue', 'javascript'],
    });
  });

  it('should handle re-initialization with new defaults', () => {
    const { result, rerender } = renderHook(
      ({ defaults }) => useFormChanges(defaults),
      { initialProps: { defaults: defaultValues } }
    );

    act(() => {
      result.current.updateField('name', 'Jane');
    });

    expect(result.current.values.name).toBe('Jane');
    expect(result.current.modifiedFields.size).toBe(1);

    // Re-render with new defaults
    const newDefaults = { ...defaultValues, name: 'Bob' };
    rerender({ defaults: newDefaults });

    // Modified fields should be preserved, but defaults reference updated
    expect(result.current.modifiedFields.size).toBe(1);
  });
});
