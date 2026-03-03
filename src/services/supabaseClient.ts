
import { createClient } from '@supabase/supabase-js';

const uplinkUrl = import.meta.env.VITE_GRID_UPLINK_URL;
const accessToken = import.meta.env.VITE_GRID_ACCESS_TOKEN;

const safeUrl = uplinkUrl || 'https://placeholder.supabase.co';
const safeToken = accessToken || 'placeholder';

if (!uplinkUrl || !accessToken) {
  console.warn("--> [WARNING]: GRID_UPLINK_NOT_CONFIGURED. PERSISTENCE OFFLINE.");
}

export const supabase = createClient(safeUrl, safeToken);