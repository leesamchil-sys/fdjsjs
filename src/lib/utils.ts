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
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error('Failed to parse localStorage:', error);
    return fallback;
  }
}

