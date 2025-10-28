import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export async function createSupabaseClient(accessToken: string, refreshToken: string): Promise<SupabaseClient | null> {
    const supabase = createClient(
        supabaseUrl,
        supabasePublishableKey,
    );
    try {
        const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
        });

        if (error) {
        console.error('Error setting session:', error.message);
        return null;
        }

        console.log('Session successfully set:', data.session);
        return supabase;
    } catch (err) {
        console.error('Unexpected error:', err);
        return null;
    }
}