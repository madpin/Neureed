"use client";

import {
  FormProvider,
  useForm,
  UseFormReturn,
  FieldValues,
  DefaultValues,
  SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ReactNode } from "react";

export interface FormProps<TFieldValues extends FieldValues> {
  /**
   * Zod schema for form validation
   */
  schema: z.ZodType<TFieldValues, any, any>;

  /**
   * Form submission handler
   */
  onSubmit: SubmitHandler<TFieldValues>;

  /**
   * Default values for form fields
   */
  defaultValues?: DefaultValues<TFieldValues>;

  /**
   * Form content (fields, buttons, etc.)
   */
  children:
    | ReactNode
    | ((methods: UseFormReturn<TFieldValues>) => ReactNode);

  /**
   * Additional CSS classes for the form element
   */
  className?: string;

  /**
   * Form ID attribute
   */
  id?: string;

  /**
   * Optional mode for validation timing
   * @default "onSubmit"
   */
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
}

/**
 * Form component with React Hook Form and Zod validation
 *
 * Provides form state management and validation using React Hook Form with Zod schema validation.
 * Wraps the form in a FormProvider to allow child components to access form context.
 *
 * @example
 * ```tsx
 * import { z } from 'zod';
 *
 * const schema = z.object({
 *   email: z.string().email('Invalid email'),
 *   password: z.string().min(8, 'Min 8 characters'),
 * });
 *
 * function LoginForm() {
 *   const handleSubmit = (data) => {
 *     console.log('Form data:', data);
 *   };
 *
 *   return (
 *     <Form schema={schema} onSubmit={handleSubmit}>
 *       <FormField name="email" label="Email">
 *         <Input type="email" />
 *       </FormField>
 *       <FormField name="password" label="Password">
 *         <Input type="password" />
 *       </FormField>
 *       <Button type="submit">Login</Button>
 *     </Form>
 *   );
 * }
 * ```
 *
 * @example
 * With render props pattern to access form methods:
 * ```tsx
 * <Form schema={schema} onSubmit={handleSubmit}>
 *   {({ formState: { isSubmitting, errors } }) => (
 *     <>
 *       <FormField name="email" label="Email">
 *         <Input type="email" />
 *       </FormField>
 *       <Button type="submit" loading={isSubmitting}>
 *         {isSubmitting ? 'Submitting...' : 'Submit'}
 *       </Button>
 *       {errors.root && <p>{errors.root.message}</p>}
 *     </>
 *   )}
 * </Form>
 * ```
 */
export function Form<TFieldValues extends FieldValues>({
  schema,
  onSubmit,
  defaultValues,
  children,
  className = "",
  id,
  mode = "onSubmit",
}: FormProps<TFieldValues>) {
  const methods = useForm<TFieldValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className={className}
        id={id}
        noValidate // Use schema validation instead of browser validation
      >
        {typeof children === "function" ? children(methods) : children}
      </form>
    </FormProvider>
  );
}
