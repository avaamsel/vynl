import { createSupabaseAdminClient } from "@/src/server/supabase";

const adminClient = createSupabaseAdminClient();

describe('Testing loading correct env', () => {

    test('Supabase URL', () => {
        expect(process.env.EXPO_PUBLIC_SUPABASE_URL).toBe('https://xgmicqytifznusiwsaor.supabase.co');
    })
});

describe('Connected to Supabase', () => {

})