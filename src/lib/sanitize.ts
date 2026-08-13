// Central input sanitization and PII guardrails.
// All sanitization logic lives here — import from this file, never redefine inline.

/**
 * Strip angle brackets from short fields (nationality, destination, visa type).
 * Prevents XML tag injection into prompt templates that use structural delimiters.
 */
export function sanitizeShortField(text: string): string {
  return text.replace(/[<>]/g, '').trim();
}

/**
 * Sanitize freeform user input before it reaches any LLM or is stored.
 * - Strips HTML tags
 * - Redacts email addresses and phone-like sequences
 * - Removes remaining non-printable / non-prose special characters
 * - Collapses whitespace and enforces 2000-char max
 */
export function sanitizeFreeform(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/\b[\w.+\-]+@[\w\-]+\.[\w.\-]+\b/g, '')
    .replace(/(\+?\d[\d\s\-().]{5,}\d)/g, '')
    .replace(/[^\w\s.,!?'"()\-:;#%&+=[\]{}|\\/<>]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 2000)
    .trim();
}
