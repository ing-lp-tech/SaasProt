import { createClient } from '@supabase/supabase-js';

// Force new config ignoring cache
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ldlwjljbncolopzdlygk.supabase.co';
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_LmyL1SkSFnkg97XkGwa7Sg_p_p8tsTM';

const supabaseUrl = 'https://ldlwjljbncolopzdlygk.supabase.co';
const supabaseAnonKey = 'sb_publishable_LmyL1SkSFnkg97XkGwa7Sg_p_p8tsTM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
