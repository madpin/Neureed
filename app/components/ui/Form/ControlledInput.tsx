"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Input, InputProps } from "./Input";

export interface ControlledInputProps extends Omit<InputProps, "name"> {
  /**
   * Field name for form registration
   */
  name: string;
}

/**
 * Controlled Input component for use with React Hook Form
 *
 * Wraps the base Input component with React Hook Form's Controller for full form integration.
 * Automatically handles field registration, validation, and error states.
 *
 * @example
 * ```tsx
 * <Form schema={schema} onSubmit={handleSubmit}>
 *   <FormField label="Email" htmlFor="email">
 *     <ControlledInput
 *       name="email"
 *       type="email"
 *       placeholder="your@email.com"
 *     />
 *   </FormField>
 * </Form>
 * ```
 */
export function ControlledInput({ name, ...props }: ControlledInputProps) {
  const { control, formState } = useFormContext();
  const hasError = !!formState.errors[name];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Input
          {...props}
          {...field}
          id={props.id || name}
          error={hasError || props.error}
        />
      )}
    />
  );
}
