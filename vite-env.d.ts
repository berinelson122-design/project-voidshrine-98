

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMetaEnv {
  readonly VITE_CORE_SENTINEL_KEY: string;
  readonly VITE_GRID_UPLINK_URL: string;
  readonly VITE_GRID_ACCESS_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}