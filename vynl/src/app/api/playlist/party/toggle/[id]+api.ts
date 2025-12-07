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
        console.log("PUT");
        const playlist_id = parseInt(id);

        if (Number.isNaN(playlist_id)) {
            console.log("Invalid Playlist ID:", id);
            return new Response('Invalid Playlist ID', {
                status: 400
            });
        }

        const body = await req.json();
        // const uid = body.uid;
        const enable = body.enable;
        
        // if (uid === undefined || uid === null) return new Response("Missing user ID", { status: 400 });
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

            // 1. Create secret party code if it doesn't exist
            const { data: c_data, error: c_err } = await supabase
                .from('playlists')
                .select('party_code,  uid')
                .eq('playlist_id', playlist_id)
                .single();
                
            if (c_err || !c_data) {
                console.log(c_err);
                console.log(c_data);
                return new Response('Playlist not found', {
                    status: 404
                });
            }

            let partyCode;
            let uid = c_data.uid;

            if (c_data.party_code) {
                partyCode = c_data.party_code;
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
                console.log(pu_err)
                return new Response('Failed to update party_user', {
                    status: 400
                });
            }

            // 4. Return party code
            return new Response(partyCode, {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } else {
            // 1. Put the in_party_mode to FALSE
            const { data: p_data, error: p_err } = await supabase
                .from('playlists')
                .update({ in_party_mode: false })
                .eq("playlist_id", playlist_id);
            
            if (p_err) {
                return new Response('Playlist not found', {
                    status: 404
                });
            }
            
            return new Response("OK", {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            });
        }

    } catch (error) {
        console.error(error);
        return new Response('Unknown Server Error', {
            status: 500
        });
    }
}