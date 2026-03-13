import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn() — merge Tailwind classes safely
 *
 * Combines clsx (conditional classes) with tailwind-merge
 * (resolves conflicting Tailwind utilities, e.g. p-2 + p-4 → p-4).
 *
 * Usage:
 *   cn('px-4 py-2', isActive && 'bg-indigo-600', className)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}