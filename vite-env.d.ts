/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Add your custom environment variables here
  // They must start with VITE_ to be exposed to the browser
  
  readonly VITE_GOOGLE_API_KEY: string;
  readonly VITE_SUPABASE_URL?: string; // Example optional variable
  readonly VITE_APP_TITLE?: string;    // Example optional variable
  
  // Add more as you need them:
  // readonly VITE_MY_SECRET_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}