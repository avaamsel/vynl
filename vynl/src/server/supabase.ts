import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;
const supabasePrivateKey = process.env.EXPO_PRIVATE_SUPABASE_KEY!;

export async function createSupabaseClient(req: Request): Promise<SupabaseClient<Database> | Response> {
    const auth = req.headers.get('Authorization');
    if (!auth || auth.split(" ").length < 2) {
        return new Response('Missing Authorization Header', {
            status: 403
        });
    }
    const access_token = auth.split(" ")[1];
    
    const supabase = createClient<Database>(
        supabaseUrl,
        supabasePublishableKey,
        {
        global: {
            headers: {
            Authorization: `Bearer ${access_token}`,
            },
        },
        }
    );

    return supabase;
}

// Used for testing only. Will provide FULL access to the database, bypassing RLS.
export function createSupabaseAdminClient(): SupabaseClient<Database> {
    return createClient<Database>(supabaseUrl, supabasePrivateKey);
}