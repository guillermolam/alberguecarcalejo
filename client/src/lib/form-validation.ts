import { z } from 'zod';

export interface ValidationErrors {
  [key: string]: string;
}

// Form validation function that validates form data and returns validation errors
export function validateForm<T extends Record<string, any>>(
  data: T,
  schema: z.ZodSchema<T>
): ValidationErrors {
  const errors: ValidationErrors = {};
  
  try {
    schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
    }
  }
  
  return errors;
}

// Helper function to check if there are any validation errors
export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

// Helper function to get the first error message for a field
export function getFieldError(errors: ValidationErrors, fieldName: string): string | undefined {
  return errors[fieldName];
}

// Helper function to clear validation errors for specific fields
export function clearFieldErrors(errors: ValidationErrors, fieldNames: string[]): ValidationErrors {
  const newErrors = { ...errors };
  fieldNames.forEach(fieldName => {
    delete newErrors[fieldName];
  });
  return newErrors;
}

// Helper function to set a validation error for a field
export function setFieldError(errors: ValidationErrors, fieldName: string, message: string): ValidationErrors {
  return {
    ...errors,
    [fieldName]: message
  };
}

// Async validation function for forms with async validation rules
export async function validateFormAsync<T extends Record<string, any>>(
  data: T,
  schema: z.ZodSchema<T>
): Promise<ValidationErrors> {
  const errors: ValidationErrors = {};
  
  try {
    await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
    }
  }
  
  return errors;
}