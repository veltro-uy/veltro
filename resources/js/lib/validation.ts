/**
 * Validation utilities for client-side form validation
 */

/**
 * Stricter email validation regex that requires:
 * - Valid email format
 * - Proper TLD (at least 2 characters after the dot)
 * Rejects emails like "example@com" or "test@domain"
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates an email address using strict regex
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
        return false;
    }
    return EMAIL_REGEX.test(email.trim());
}

/**
 * Validates email and returns error message in Spanish
 * @param email - Email address to validate
 * @returns Error message in Spanish if invalid, null if valid
 */
export function validateEmail(email: string): string | null {
    if (!email || email.trim() === '') {
        return 'El campo correo electrónico es obligatorio.';
    }
    
    if (!isValidEmail(email)) {
        return 'El campo correo electrónico debe ser una dirección de correo electrónico válida.';
    }
    
    return null;
}

/**
 * Validates password and returns error message in Spanish
 * @param password - Password to validate
 * @param minLength - Minimum password length (default: 8)
 * @returns Error message in Spanish if invalid, null if valid
 */
export function validatePassword(password: string, minLength: number = 8): string | null {
    if (!password || password.trim() === '') {
        return 'El campo contraseña es obligatorio.';
    }
    
    if (password.length < minLength) {
        return `El campo contraseña debe tener al menos ${minLength} caracteres.`;
    }
    
    return null;
}

/**
 * Validates password confirmation match
 * @param password - Original password
 * @param passwordConfirmation - Password confirmation
 * @returns Error message in Spanish if invalid, null if valid
 */
export function validatePasswordConfirmation(
    password: string,
    passwordConfirmation: string
): string | null {
    if (!passwordConfirmation || passwordConfirmation.trim() === '') {
        return 'El campo confirmación de contraseña es obligatorio.';
    }
    
    if (password !== passwordConfirmation) {
        return 'La confirmación del campo contraseña no coincide.';
    }
    
    return null;
}

/**
 * Validates name field
 * @param name - Name to validate
 * @param minLength - Minimum name length (default: 2)
 * @param maxLength - Maximum name length (default: 255)
 * @returns Error message in Spanish if invalid, null if valid
 */
export function validateName(
    name: string,
    minLength: number = 2,
    maxLength: number = 255
): string | null {
    if (!name || name.trim() === '') {
        return 'El campo nombre es obligatorio.';
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length < minLength) {
        return `El campo nombre debe tener al menos ${minLength} caracteres.`;
    }
    
    if (trimmedName.length > maxLength) {
        return `El campo nombre no debe ser mayor que ${maxLength} caracteres.`;
    }
    
    return null;
}

/**
 * Validation result type
 */
export interface ValidationResult {
    isValid: boolean;
    error: string | null;
}

/**
 * Validates a field value based on validation rules
 */
export interface FieldValidator {
    (value: string): string | null;
}

/**
 * Validates multiple fields and returns all errors
 * @param validators - Object with field names as keys and validator functions as values
 * @param values - Object with field names as keys and values to validate
 * @returns Object with field names as keys and error messages as values (null if valid)
 */
export function validateFields(
    validators: Record<string, FieldValidator>,
    values: Record<string, string>
): Record<string, string | null> {
    const errors: Record<string, string | null> = {};
    
    for (const [field, validator] of Object.entries(validators)) {
        const value = values[field] || '';
        errors[field] = validator(value);
    }
    
    return errors;
}

