import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API Base URL helper
export const getApiBaseUrl = (): string => {
  return typeof __API_BASE_URL__ !== 'undefined' 
    ? __API_BASE_URL__ 
    : 'http://localhost:8000';
}

// WASM service helper
export const loadWasmService = async (serviceName: string) => {
  try {
    const wasmModule = await import(`@wasm/${serviceName}`);
    return wasmModule;
  } catch (error) {
    console.warn(`Failed to load WASM service: ${serviceName}`, error);
    return null;
  }
}