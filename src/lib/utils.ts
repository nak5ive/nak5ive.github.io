// src/lib/utils.ts
// Shared utilities used across components at build time.

/** URL-safe slug from an arbitrary string. */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Stable DOM id for a company group element. */
export function companyId(name: string): string {
  return `company-${slugify(name)}`;
}

/** Convert backtick-wrapped runs to inline <code> elements. */
export function inlineCode(text: string): string {
  return text.replace(/`([^`]+)`/g, '<code>$1</code>');
}
