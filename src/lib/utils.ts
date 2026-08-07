import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw || raw === 'undefined') {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    if (fallback !== null && typeof fallback === 'object' && !Array.isArray(fallback) && (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))) {
      return fallback;
    }
    return parsed as T;
  } catch (error) {
    console.error('Failed to parse localStorage:', error);
    return fallback;
  }
}

