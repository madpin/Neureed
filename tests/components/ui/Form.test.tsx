import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Form } from '@/app/components/ui/Form';
import { FormField } from '@/app/components/ui/Form';
import { z } from 'zod';

const testSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  age: z.number().min(18, 'Must be 18 or older'),
});

type TestFormData = z.infer<typeof testSchema>;

describe('Form', () => {
  it('renders form with children', () => {
    render(
      <Form schema={testSchema} onSubmit={() => {}}>
        <div>Form Content</div>
      </Form>
    );

    expect(screen.getByText('Form Content')).toBeInTheDocument();
  });

  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn();

    render(
      <Form<TestFormData>
        schema={testSchema}
        onSubmit={onSubmit}
        defaultValues={{
          email: 'test@example.com',
          password: 'password123',
          age: 25,
        }}
      >
        <button type="submit">Submit</button>
      </Form>
    );

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'password123',
          age: 25,
        },
        expect.anything()
      );
    });
  });

  it('shows validation errors for invalid data', async () => {
    const onSubmit = vi.fn();

    render(
      <Form<TestFormData>
        schema={testSchema}
        onSubmit={onSubmit}
        defaultValues={{
          email: 'invalid-email',
          password: 'short',
          age: 15,
        }}
      >
        {({ formState: { errors } }) => (
          <>
            <div>{errors.email?.message}</div>
            <div>{errors.password?.message}</div>
            <div>{errors.age?.message}</div>
            <button type="submit">Submit</button>
          </>
        )}
      </Form>
    );

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('Must be 18 or older')).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Form schema={testSchema} onSubmit={() => {}} className="custom-form">
        <div>Content</div>
      </Form>
    );

    const form = container.querySelector('form');
    expect(form).toHaveClass('custom-form');
  });

  it('sets form id attribute', () => {
    const { container } = render(
      <Form schema={testSchema} onSubmit={() => {}} id="test-form">
        <div>Content</div>
      </Form>
    );

    const form = container.querySelector('form');
    expect(form).toHaveAttribute('id', 'test-form');
  });

  it('supports render props pattern', () => {
    render(
      <Form schema={testSchema} onSubmit={() => {}}>
        {({ formState: { isSubmitting } }) => (
          <div>{isSubmitting ? 'Submitting...' : 'Ready'}</div>
        )}
      </Form>
    );

    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('validates on blur when mode is set to onBlur', async () => {
    render(
      <Form
        schema={testSchema}
        onSubmit={() => {}}
        mode="onBlur"
      >
        {({ register, formState: { errors } }) => (
          <>
            <input {...register('email')} />
            {errors.email && <div>{errors.email.message}</div>}
            <button type="submit">Submit</button>
          </>
        )}
      </Form>
    );

    const input = screen.getByRole('textbox');

    // Type invalid email
    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  it('disables browser validation with noValidate', () => {
    const { container } = render(
      <Form schema={testSchema} onSubmit={() => {}}>
        <div>Content</div>
      </Form>
    );

    const form = container.querySelector('form');
    expect(form).toHaveAttribute('noValidate');
  });
});

describe('FormField', () => {
  const simpleSchema = z.object({
    name: z.string().min(1, 'Name is required'),
  });

  it('renders text input with label', () => {
    render(
      <Form schema={simpleSchema} onSubmit={() => {}}>
        <FormField name="name" label="Name" />
      </Form>
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('shows error message when validation fails', async () => {
    render(
      <Form schema={simpleSchema} onSubmit={() => {}}>
        <FormField name="name" label="Name" />
        <button type="submit">Submit</button>
      </Form>
    );

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('displays description text', () => {
    render(
      <Form schema={simpleSchema} onSubmit={() => {}}>
        <FormField name="name" label="Name" description="Enter your full name" />
      </Form>
    );

    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(
      <Form schema={simpleSchema} onSubmit={() => {}}>
        <FormField name="name" label="Name" required />
      </Form>
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
