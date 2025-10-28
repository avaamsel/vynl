import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export async function createSupabaseClient(accessToken: string): Promise<SupabaseClient | null> {
    const supabase = createClient(
        supabaseUrl,
        supabasePublishableKey,
    );
    try {
        const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        // We give it a placeholder value since we do not have a refresh token.
        // These supabase clients should be short lived anyways so the refresh 
        // token should never get used
        refresh_token: "PLACEHOLDER",
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