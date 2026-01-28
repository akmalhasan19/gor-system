
/**
 * Removes all non-digit characters from a phone number string.
 * Example: "0812-3456-7890" -> "081234567890"
 */
export function sanitizePhone(phone: string): string {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
}

/**
 * Formats a phone number for display.
 * Example: "081234567890" -> "0812-3456-7890" (simple chunking)
 * This is a basic implementation and can be improved.
 */
export function formatPhone(phone: string): string {
    if (!phone) return "";
    const clean = sanitizePhone(phone);
    // basic formatting: 4-4-rest
    if (clean.length > 8) {
        return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
    } else if (clean.length > 4) {
        return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    }
    return clean;
}
