"use client";

import { ReactNode } from "react";
import { UseFormReturn, FieldValues } from "react-hook-form";

/**
 * Form Wrapper Component
 *
 * Provides consistent form layout and error handling
 * Works with React Hook Form
 */

interface FormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: ReactNode;
  className?: string;
}

export function Form<T extends FieldValues>({
  form,
  onSubmit,
  children,
  className = "",
}: FormProps<T>) {
  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handling is done by the parent component
      console.error("Form submission error:", error);
    }
  });

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

interface FormActionsProps {
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  isValid?: boolean;
}

export function FormActions({
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isSubmitting = false,
  isValid = true,
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-2 pt-4 border-t border-border">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-sm border border-border rounded hover:bg-muted transition-colors"
        disabled={isSubmitting}
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

interface FormErrorProps {
  message: string;
}

export function FormError({ message }: FormErrorProps) {
  return (
    <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
      <div className="flex gap-2">
        <svg
          className="h-5 w-5 flex-shrink-0 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="text-sm text-destructive">{message}</div>
      </div>
    </div>
  );
}

interface FormSuccessProps {
  message: string;
}

export function FormSuccess({ message }: FormSuccessProps) {
  return (
    <div className="rounded-lg border border-green-500 bg-green-500/10 p-3">
      <div className="flex gap-2">
        <svg
          className="h-5 w-5 flex-shrink-0 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <div className="text-sm text-green-700 dark:text-green-400">{message}</div>
      </div>
    </div>
  );
}
