/* eslint-disable react-hooks/rules-of-hooks */
import type { Meta, StoryObj } from "@storybook/react";
import { FormField, Input, Select, TextArea } from "./index";
import { useState } from "react";

const meta: Meta = {
  title: "UI/Form Components",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;

/**
 * FormField with Input - basic example
 */
export const BasicFormField: StoryObj = {
  render: () => (
    <div style={{ width: "400px" }}>
      <FormField label="Email" htmlFor="email" required>
        <Input id="email" type="email" placeholder="your@email.com" />
      </FormField>
    </div>
  ),
};

/**
 * FormField with description
 */
export const WithDescription: StoryObj = {
  render: () => (
    <div style={{ width: "400px" }}>
      <FormField
        label="Password"
        description="Must be at least 8 characters"
        htmlFor="password"
        required
      >
        <Input id="password" type="password" placeholder="••••••••" />
      </FormField>
    </div>
  ),
};

/**
 * FormField with error
 */
export const WithError: StoryObj = {
  render: () => (
    <div style={{ width: "400px" }}>
      <FormField
        label="Email"
        error="Invalid email address"
        htmlFor="email-error"
        required
      >
        <Input
          id="email-error"
          type="email"
          value="invalid-email"
          error
          onChange={() => {}}
        />
      </FormField>
    </div>
  ),
};

/**
 * Input variants
 */
export const InputVariants: StoryObj = {
  render: () => (
    <div style={{ width: "400px", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <label className="mb-1 block text-sm font-medium">Default</label>
        <Input placeholder="Default input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Filled</label>
        <Input variant="filled" placeholder="Filled input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">With Error</label>
        <Input error placeholder="Input with error" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Disabled</label>
        <Input disabled placeholder="Disabled input" />
      </div>
    </div>
  ),
};

/**
 * Input with icons
 */
export const InputWithIcons: StoryObj = {
  render: () => (
    <div style={{ width: "400px", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <label className="mb-1 block text-sm font-medium">With Left Icon</label>
        <Input
          placeholder="Search..."
          leftIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">With Right Icon</label>
        <Input
          type="password"
          placeholder="Password"
          rightIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          }
        />
      </div>
    </div>
  ),
};

/**
 * Select dropdown
 */
export const SelectExample: StoryObj = {
  render: () => (
    <div style={{ width: "400px" }}>
      <FormField label="Category" htmlFor="category" required>
        <Select id="category">
          <option value="">Select a category</option>
          <option value="tech">Technology</option>
          <option value="science">Science</option>
          <option value="news">News</option>
          <option value="sports">Sports</option>
        </Select>
      </FormField>
    </div>
  ),
};

/**
 * TextArea example
 */
export const TextAreaExample: StoryObj = {
  render: () => (
    <div style={{ width: "400px" }}>
      <FormField
        label="Message"
        description="Enter your message (max 500 characters)"
        htmlFor="message"
      >
        <TextArea id="message" rows={5} placeholder="Type your message here..." />
      </FormField>
    </div>
  ),
};

/**
 * Complete form example
 */
export const CompleteForm: StoryObj = {
  render: () => {
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      category: "",
      message: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: Record<string, string> = {};

      if (!formData.name) newErrors.name = "Name is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.category) newErrors.category = "Please select a category";

      setErrors(newErrors);

      if (Object.keys(newErrors).length === 0) {
        alert("Form submitted!");
      }
    };

    return (
      <form onSubmit={handleSubmit} style={{ width: "500px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <FormField
            label="Name"
            htmlFor="name"
            required
            error={errors.name}
          >
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!errors.name}
              placeholder="John Doe"
            />
          </FormField>

          <FormField
            label="Email"
            description="We'll never share your email"
            htmlFor="email"
            required
            error={errors.email}
          >
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={!!errors.email}
              placeholder="john@example.com"
            />
          </FormField>

          <FormField
            label="Category"
            htmlFor="category"
            required
            error={errors.category}
          >
            <Select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              error={!!errors.category}
            >
              <option value="">Select a category</option>
              <option value="tech">Technology</option>
              <option value="science">Science</option>
              <option value="news">News</option>
            </Select>
          </FormField>

          <FormField
            label="Message"
            description="Optional message (max 500 characters)"
            htmlFor="message"
          >
            <TextArea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={5}
              placeholder="Your message here..."
              maxLength={500}
            />
          </FormField>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: "1rem" }}
          >
            Submit
          </button>
        </div>
      </form>
    );
  },
};
