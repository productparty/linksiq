export const config = {
  API_URL: (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(
    /\/$/,
    ""
  ),
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  APP_URL: import.meta.env.VITE_APP_URL || "http://localhost:5173",
};
