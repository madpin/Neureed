"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Select, SelectProps } from "./Select";

export interface ControlledSelectProps extends Omit<SelectProps, "name"> {
  /**
   * Field name for form registration
   */
  name: string;
}

/**
 * Controlled Select component for use with React Hook Form
 *
 * Wraps the base Select component with React Hook Form's Controller for full form integration.
 * Automatically handles field registration, validation, and error states.
 *
 * @example
 * ```tsx
 * <Form schema={schema} onSubmit={handleSubmit}>
 *   <FormField label="Category" htmlFor="category">
 *     <ControlledSelect name="category">
 *       <option value="">Select a category</option>
 *       <option value="tech">Technology</option>
 *       <option value="science">Science</option>
 *     </ControlledSelect>
 *   </FormField>
 * </Form>
 * ```
 */
export function ControlledSelect({
  name,
  children,
  ...props
}: ControlledSelectProps) {
  const { control, formState } = useFormContext();
  const hasError = !!formState.errors[name];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          {...props}
          {...field}
          id={props.id || name}
          error={hasError || props.error}
        >
          {children}
        </Select>
      )}
    />
  );
}
