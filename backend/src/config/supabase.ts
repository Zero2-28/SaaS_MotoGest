import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Service role client: bypasses RLS para subidas desde el servidor
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
