import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(priceInCents: number): string {
  return `€${(priceInCents / 100).toFixed(2)}`;
}

// API Base URL helper
export const getApiBaseUrl = (): string => {
  return typeof __API_BASE_URL__ !== 'undefined' 
    ? __API_BASE_URL__ 
    : 'http://localhost:8000';
}

// WASM service helper with proper error handling
export const loadWasmService = async (serviceName: string) => {
  try {
    // Use vite-ignore comment to suppress dynamic import warning
    const wasmModule = await import(/* @vite-ignore */ `../../../pkg/${serviceName}`);
    return wasmModule;
  } catch (error) {
    console.warn(`Failed to load WASM service: ${serviceName}`, error);
    return null;
  }
}