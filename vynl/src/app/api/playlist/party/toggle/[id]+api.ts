import { createSupabaseClient } from "@/src/server/supabase";
import { party_user } from "@/src/types/database/index"

function generatePartyCode(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        const index = Math.floor(Math.random() * chars.length);
        code += chars[index];
    }
    return code;
}

// PUT "api/playlist/party/toggle/:id"
export async function PUT(req: Request, { id }: Record<string, string>) {
    if (!id) {
        return new Response("Missing playlist ID", { status: 400 });
    }
    try {
        const playlist_id = parseInt(id);

        if (Number.isNaN(playlist_id)) {
            console.log("Invalid Playlist ID:", id);
            return new Response('Invalid Playlist ID', {
                status: 400
            });
        }

        const body = await req.json();
        const uid = body.uid;
        const enable = body.enable;
        
        if (uid === undefined || uid === null) return new Response("Missing user ID", { status: 400 });
        if (enable === undefined || enable === null) return new Response("Missing enable", { status: 400 });

        const supabase = await createSupabaseClient(req);
        // If given an error response return it
        if (supabase instanceof Response) {
            return supabase
        }

        if (enable) {
            // Get the authenticated user from Supabase
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            if (authError || !authUser) {
                return new Response('Unauthorized', {
                    status: 401
                });
            }

            // Verify that the user from request body matches the authenticated user
            if (authUser.id !== uid) {
                return new Response('User ID mismatch', {
                    status: 403
                });
            }

            // 1. Create secret party code if it doesn't exist
            const { data: c_data, error: c_err } = await supabase
                .from('playlists')
                .select('party_code')
                .eq('playlist_id', playlist_id)

            let partyCode;

            if (c_err) {
                console.error('Error checking party code:', c_err);
                return new Response('Unable to check the party code', {
                    status: 404
                });
            }

            // Check if playlist exists and has a party code
            if (c_data && c_data.length > 0 && c_data[0]?.party_code) {
                partyCode = c_data[0].party_code;
            } else {
                partyCode = generatePartyCode(6);
            }

            // 2. Store party code and put in_party_mode to TRUE
            const { data: p_data, error: p_err } = await supabase
                .from('playlists')
                .update({ party_code: partyCode, in_party_mode: true })
                .eq("playlist_id", playlist_id);

            if (p_err) {
                console.error('Error updating playlist:', p_err);
                return new Response('Failed to update playlist', {
                    status: 400
                });
            }
            
            // 3. Add owner to party_user
            // RLS will automatically set user_id based on the authenticated user
            // Only insert playlist_id, just like the link endpoint does
            const { data: pu_data, error: pu_err } = await supabase
                .from('party_users')
                .insert({ playlist_id: playlist_id });

            if (pu_err) {
                // If it's a unique constraint violation, the user is already linked, which is fine
                // Check if the error is about duplicate key
                if (pu_err.code === '23505' || pu_err.message?.includes('duplicate') || pu_err.message?.includes('unique')) {
                    // User is already in party_users, which is fine
                    console.log('User already linked to playlist, continuing...');
                } else {
                    console.error('Error inserting party_user:', pu_err);
                    return new Response(`Failed to update party_user: ${pu_err.message}`, {
                        status: 400
                    });
                }
            }

            // 4. Return party code
            return new Response(JSON.stringify(partyCode), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } else {
            // 1. Put the in_party_mode to FALSE
            const { data: p_data, error: p_err } = await supabase
                .from('playlists')
                .update({ in_party_mode: false })
                .eq("playlist_id", playlist_id);
            
            return new Response(null, {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error(error);
        return new Response('Unknown Server Error', {
            status: 500
        });
    }
}