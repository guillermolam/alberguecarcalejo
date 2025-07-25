// Global type definitions for the frontend

// API Base URL from Vite config
declare const __API_BASE_URL__: string;

// WASM service types
declare module '@wasm/*' {
  export interface WasmModule {
    [key: string]: any;
  }
}

// Asset imports
declare module '@assets/*' {
  const content: string;
  export default content;
}

// Shared types from Rust services
declare module '@shared/*' {
  export interface SharedTypes {
    [key: string]: any;
  }
}