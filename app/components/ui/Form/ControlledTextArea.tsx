"use client";

import { useFormContext, Controller } from "react-hook-form";
import { TextArea, TextAreaProps } from "./TextArea";

export interface ControlledTextAreaProps extends Omit<TextAreaProps, "name"> {
  /**
   * Field name for form registration
   */
  name: string;
}

/**
 * Controlled TextArea component for use with React Hook Form
 *
 * Wraps the base TextArea component with React Hook Form's Controller for full form integration.
 * Automatically handles field registration, validation, and error states.
 *
 * @example
 * ```tsx
 * <Form schema={schema} onSubmit={handleSubmit}>
 *   <FormField label="Description" htmlFor="description">
 *     <ControlledTextArea
 *       name="description"
 *       rows={5}
 *       placeholder="Enter a description..."
 *     />
 *   </FormField>
 * </Form>
 * ```
 */
export function ControlledTextArea({ name, ...props }: ControlledTextAreaProps) {
  const { control, formState } = useFormContext();
  const hasError = !!formState.errors[name];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextArea
          {...props}
          {...field}
          id={props.id || name}
          error={hasError || props.error}
        />
      )}
    />
  );
}
