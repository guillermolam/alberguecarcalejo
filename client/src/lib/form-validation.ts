import { z } from 'zod';
import { RegistrationFormData } from '@/stores/registration-store';

// Comprehensive validation schema for all form fields
export const registrationValidationSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
    
  lastName1: z.string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters'),
    
  lastName2: z.string()
    .max(50, 'Second last name cannot exceed 50 characters')
    .optional(),
    
  documentNumber: z.string()
    .min(1, 'Document number is required')
    .min(8, 'Document number must be at least 8 characters')
    .max(20, 'Document number cannot exceed 20 characters'),
    
  documentType: z.string()
    .min(1, 'Document type is required'),
    
  birthDate: z.string()
    .min(1, 'Birth date is required')
    .refine((date) => {
      const parsed = new Date(date);
      const now = new Date();
      const age = now.getFullYear() - parsed.getFullYear();
      return age >= 16 && age <= 120;
    }, 'Age must be between 16 and 120 years'),
    
  gender: z.string()
    .min(1, 'Gender is required'),
    
  nationality: z.string()
    .min(1, 'Nationality is required')
    .min(2, 'Nationality must be at least 2 characters'),
    
  addressStreet: z.string()
    .min(1, 'Street address is required')
    .min(5, 'Street address must be at least 5 characters')
    .max(200, 'Street address cannot exceed 200 characters'),
    
  addressCity: z.string()
    .min(1, 'City is required')
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City cannot exceed 100 characters'),
    
  addressPostalCode: z.string()
    .min(1, 'Postal code is required')
    .min(4, 'Postal code must be at least 4 characters')
    .max(10, 'Postal code cannot exceed 10 characters'),
    
  addressCountry: z.string()
    .min(1, 'Country is required')
    .min(2, 'Country must be at least 2 characters'),
    
  phone: z.string()
    .min(1, 'Phone number is required')
    .min(9, 'Phone number must be at least 9 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .refine((phone) => /^\d+$/.test(phone.replace(/[\s\-\+\(\)]/g, '')), 'Phone number must contain only digits'),
    
  email: z.string()
    .min(1, 'Email is required')
    .email('Email format is invalid')
    .max(100, 'Email cannot exceed 100 characters'),
    
  paymentType: z.string()
    .min(1, 'Payment type is required'),
    
  estimatedArrivalTime: z.string()
    .min(1, 'Estimated arrival time is required')
    .refine((time) => {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return timeRegex.test(time);
    }, 'Invalid time format (HH:MM)'),
    
  selectedBedId: z.number()
    .min(1, 'Please select a bed')
    .optional(),
});

// Field-specific validation errors type
export type ValidationErrors = {
  [K in keyof RegistrationFormData]?: string;
};

// Validate individual field
export const validateField = (field: keyof RegistrationFormData, value: any): string | undefined => {
  try {
    const fieldSchema = registrationValidationSchema.shape[field];
    if (fieldSchema) {
      fieldSchema.parse(value);
    }
    return undefined;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message;
    }
    return 'Invalid value';
  }
};

// Validate entire form and return field-specific errors
export const validateForm = (formData: RegistrationFormData): ValidationErrors => {
  try {
    registrationValidationSchema.parse(formData);
    return {};
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationErrors = {};
      error.errors.forEach((err) => {
        const fieldName = err.path[0] as keyof RegistrationFormData;
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = err.message;
        }
      });
      return errors;
    }
    return { firstName: 'Unknown validation error' };
  }
};

// Check if form has any validation errors
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

// Get first validation error message
export const getFirstValidationError = (errors: ValidationErrors): string | undefined => {
  const firstError = Object.values(errors).find(error => error);
  return firstError;
};