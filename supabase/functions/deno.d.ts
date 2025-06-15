// Type definitions for Deno runtime in Supabase Edge Functions
declare namespace Deno {
  export namespace env {
    export function get(name: string): string | undefined;
  }
}

export {};

// Global fetch is available in Deno
declare global {
  function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
} 