"use client";

import { UseFormRegister, FieldError } from "react-hook-form";

/**
 * Form Field Components
 *
 * Reusable form field components with validation support
 * Designed to work with React Hook Form
 */

interface BaseFieldProps {
  label: string;
  error?: FieldError;
  helpText?: string;
  required?: boolean;
}

interface TextFieldProps extends BaseFieldProps {
  name: string;
  register: UseFormRegister<any>;
  placeholder?: string;
  type?: "text" | "email" | "url" | "password";
  autoFocus?: boolean;
}

export function TextField({
  label,
  name,
  register,
  error,
  helpText,
  placeholder,
  type = "text",
  required,
  autoFocus,
}: TextFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary ${
          error ? "border-destructive" : "border-border"
        }`}
        {...register(name)}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

interface TextAreaFieldProps extends BaseFieldProps {
  name: string;
  register: UseFormRegister<any>;
  placeholder?: string;
  rows?: number;
}

export function TextAreaField({
  label,
  name,
  register,
  error,
  helpText,
  placeholder,
  rows = 3,
  required,
}: TextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary ${
          error ? "border-destructive" : "border-border"
        }`}
        {...register(name)}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  name: string;
  register: UseFormRegister<any>;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectField({
  label,
  name,
  register,
  error,
  helpText,
  options,
  placeholder,
  required,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <select
        id={name}
        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary ${
          error ? "border-destructive" : "border-border"
        }`}
        {...register(name)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

interface NumberFieldProps extends BaseFieldProps {
  name: string;
  register: UseFormRegister<any>;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export function NumberField({
  label,
  name,
  register,
  error,
  helpText,
  min,
  max,
  step = 1,
  placeholder,
  required,
}: NumberFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        id={name}
        type="number"
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary ${
          error ? "border-destructive" : "border-border"
        }`}
        {...register(name, { valueAsNumber: true })}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  helpText?: string;
}

export function CheckboxField({
  label,
  name,
  register,
  error,
  helpText,
}: CheckboxFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          id={name}
          type="checkbox"
          className="cursor-pointer rounded border-border"
          {...register(name)}
        />
        <label htmlFor={name} className="text-sm cursor-pointer">
          {label}
        </label>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

interface ColorPickerFieldProps extends BaseFieldProps {
  name: string;
  register: UseFormRegister<any>;
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}

export function ColorPickerField({
  label,
  name,
  colors,
  value,
  onChange,
  error,
  helpText,
}: ColorPickerFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-8 h-8 rounded-full transition-all ${
              value === color
                ? "ring-2 ring-offset-2 ring-primary scale-110"
                : "hover:scale-105"
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}
