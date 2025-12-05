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
        if (!uid) return new Response("Missing user ID", { status: 400 });

        const supabase = await createSupabaseClient(req);
        // If given an error response return it
        if (supabase instanceof Response) {
            return supabase
        }

        // 0. Check if user is owner of the playlist
        const { data, error } = await supabase
            .from('playlists')
            .select('uid')
            .eq('playlist_id', playlist_id)

        if (error || data.length === 0) {
            return new Response('Failed to verify owner', {
                status: 400
            });
        }

        if (data[0]?.uid !== uid) {
            console.log("Sorry you aren't the owner of the playlist");
            return new Response('Failed to verify owner', {
                status: 400
            });
        }

        // 1. Create secret party code
        const partyCode = generatePartyCode(6);

        // 2. Store party code and put in_party_mode to TRUE
        const { data: p_data, error: p_err } = await supabase
            .from('playlists')
            .update({ party_code: partyCode, in_party_mode: true })
            .eq("playlist_id", playlist_id);

        if (p_err) {
            return new Response('Failed to update playlist', {
                status: 400
            });
        }
        // 3. Add owner to party_user
        const party_user_to_add: party_user = {playlist_id: playlist_id, user_id: uid}

        const { data: pu_data, error: pu_err } = await supabase
            .from('party_user')
            .upsert(party_user_to_add)

        if (pu_err) {
            return new Response('Failed to update party_user', {
                status: 400
            });
        }

        // 4. Return party code
        return new Response(JSON.stringify(partyCode), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(error);
        return new Response('Unknown Server Error', {
            status: 500
        });
    }
}