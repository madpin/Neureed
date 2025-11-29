import { useState, useCallback, useMemo } from 'react';

export interface UseFormChangesReturn<T extends Record<string, any>> {
  /**
   * Current form values
   */
  values: T;

  /**
   * Set of field names that have been modified
   */
  modifiedFields: Set<keyof T>;

  /**
   * Update a specific field value and mark it as modified
   */
  updateField: (field: keyof T, value: T[keyof T]) => void;

  /**
   * Reset a specific field to its default value and unmark as modified
   */
  resetField: (field: keyof T) => void;

  /**
   * Reset all fields to default values and clear modified fields
   */
  resetAll: () => void;

  /**
   * Boolean indicating if any fields have been modified
   */
  hasChanges: boolean;

  /**
   * Get an object containing only the fields that have been modified
   */
  getChangedValues: () => Partial<T>;
}

/**
 * Hook for tracking form field changes and managing modified state.
 * Useful for bulk edit forms where you need to know which fields were changed.
 *
 * @example
 * ```tsx
 * const DEFAULTS = {
 *   refreshInterval: 30,
 *   maxArticles: 100,
 *   extractionMethod: 'rss' as const,
 * };
 *
 * const {
 *   values,
 *   modifiedFields,
 *   updateField,
 *   resetField,
 *   getChangedValues,
 *   hasChanges
 * } = useFormChanges(DEFAULTS);
 *
 * // Update a field
 * <input
 *   value={values.refreshInterval}
 *   onChange={(e) => updateField('refreshInterval', parseInt(e.target.value))}
 * />
 *
 * // Reset a field
 * {modifiedFields.has('refreshInterval') && (
 *   <button onClick={() => resetField('refreshInterval')}>Reset</button>
 * )}
 *
 * // On submit, send only changed values
 * const handleSubmit = () => {
 *   const changes = getChangedValues();
 *   await api.updateSettings(changes);
 * };
 * ```
 */
export function useFormChanges<T extends Record<string, any>>(
  defaults: T
): UseFormChangesReturn<T> {
  const [values, setValues] = useState<T>(defaults);
  const [modifiedFields, setModifiedFields] = useState<Set<keyof T>>(new Set());

  /**
   * Update a field value and mark it as modified
   */
  const updateField = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
    setModifiedFields((prev) => new Set(prev).add(field));
  }, []);

  /**
   * Reset a field to its default value and remove from modified set
   */
  const resetField = useCallback(
    (field: keyof T) => {
      setValues((prev) => ({
        ...prev,
        [field]: defaults[field],
      }));
      setModifiedFields((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    },
    [defaults]
  );

  /**
   * Reset all fields to defaults and clear modified set
   */
  const resetAll = useCallback(() => {
    setValues(defaults);
    setModifiedFields(new Set());
  }, [defaults]);

  /**
   * Check if any fields have been modified
   */
  const hasChanges = useMemo(() => modifiedFields.size > 0, [modifiedFields]);

  /**
   * Get only the changed values as a partial object
   */
  const getChangedValues = useCallback((): Partial<T> => {
    const changed: Partial<T> = {};
    modifiedFields.forEach((field) => {
      changed[field] = values[field];
    });
    return changed;
  }, [values, modifiedFields]);

  return {
    values,
    modifiedFields,
    updateField,
    resetField,
    resetAll,
    hasChanges,
    getChangedValues,
  };
}
