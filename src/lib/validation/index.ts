/**
 * Validation Helper Utilities
 * 
 * Provides a consistent pattern for validating API request bodies
 * with Zod schemas and returning proper error responses.
 */

import { NextResponse } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * Result type for validation
 */
export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; error: NextResponse };

/**
 * Validates request data against a Zod schema
 * Returns validated data or an error response
 * 
 * @example
 * const result = validateRequest(CreatePaymentSchema, body);
 * if (!result.success) return result.error;
 * const { transactionId, amount } = result.data;
 */
export function validateRequest<T>(
    schema: ZodSchema<T>,
    data: unknown
): ValidationResult<T> {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof ZodError) {
            return {
                success: false,
                error: NextResponse.json(
                    {
                        success: false,
                        error: 'Validation failed',
                        details: formatZodErrors(error),
                    },
                    { status: 400 }
                ),
            };
        }

        // Unexpected error
        console.error('Validation error:', error);
        return {
            success: false,
            error: NextResponse.json(
                { success: false, error: 'Invalid request data' },
                { status: 400 }
            ),
        };
    }
}

/**
 * Formats Zod errors into a user-friendly structure
 */
export function formatZodErrors(error: ZodError): Record<string, string> {
    const errors: Record<string, string> = {};

    for (const issue of error.issues) {
        const path = issue.path.join('.') || 'root';
        errors[path] = issue.message;
    }

    return errors;
}

/**
 * Async version that parses JSON body and validates in one step
 * 
 * @example
 * const result = await validateRequestBody(request, CreatePaymentSchema);
 * if (!result.success) return result.error;
 */
export async function validateRequestBody<T>(
    request: Request,
    schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
    try {
        const body = await request.json();
        return validateRequest(schema, body);
    } catch (error) {
        // JSON parse error
        return {
            success: false,
            error: NextResponse.json(
                { success: false, error: 'Invalid JSON in request body' },
                { status: 400 }
            ),
        };
    }
}

// Re-export schemas for convenience
export * from './schemas';
