"use client";

import { ReactNode } from "react";

export interface FormFieldProps {
  /**
   * Label text for the field
   */
  label: string;

  /**
   * Optional description text shown below the label
   */
  description?: string;

  /**
   * Error message to display (overrides React Hook Form error if provided)
   */
  error?: string;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * HTML for attribute linking label to input
   * Also used as the field name when using React Hook Form
   */
  htmlFor: string;

  /**
   * Field name for React Hook Form (defaults to htmlFor)
   * Only needed if htmlFor and form field name differ
   */
  name?: string;

  /**
   * Form input element(s) to wrap
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * FormField component - wrapper for form inputs with label, description, and error
 *
 * Provides consistent layout and styling for all form fields across the application.
 * Handles label, description, error states, and required indicators.
 *
 * Works with both standalone forms and React Hook Form:
 * - When used outside React Hook Form: provide error prop explicitly
 * - When used inside React Hook Form: automatically gets error from form context
 *
 * @example
 * Standalone usage:
 * ```tsx
 * <FormField
 *   label="Email"
 *   description="We'll never share your email"
 *   error={errors.email}
 *   htmlFor="email"
 *   required
 * >
 *   <Input id="email" type="email" />
 * </FormField>
 * ```
 *
 * @example
 * With React Hook Form:
 * ```tsx
 * <Form schema={schema} onSubmit={handleSubmit}>
 *   <FormField
 *     label="Email"
 *     description="We'll never share your email"
 *     htmlFor="email"
 *     required
 *   >
 *     <Input {...register("email")} />
 *   </FormField>
 * </Form>
 * ```
 */
export function FormField({
  label,
  description,
  error: errorProp,
  required,
  htmlFor,
  name,
  children,
  className = "",
}: FormFieldProps) {
  // Simply use the error prop - controlled components handle React Hook Form integration
  const error = errorProp;

  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-sm font-medium text-foreground/70"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {description && !error && (
        <p className="mt-1 text-xs text-foreground/60">{description}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
