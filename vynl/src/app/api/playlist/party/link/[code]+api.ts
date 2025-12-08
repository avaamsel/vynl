import { deserializePlaylist, getPlaylistFromDatabase } from "@/src/server/dataDeserialization";
import { createSupabaseClient } from "@/src/server/supabase";

// PUT "api/playlist/party/link/:code"
export async function PUT(req: Request, { code }: Record<string, string>) {
    try {
        const supabase = await createSupabaseClient(req);

        // If given an error response return it
        if (supabase instanceof Response) {
            return supabase
        }

        // 6 is a "magic number" here, should probably make a constants file that 
        // contains any magic numbers in the future.
        if (code.length != 6) {
           return new Response("Invalid Party Code", {
                status: 400,
                headers: { 'Content-Type': 'text/html' }
            });
        }

        console.log("Code : ", code);
        const { data: playlist_id, error: p_err } = await supabase
            .rpc('get_party_id', {
                code: code
            });

        if (p_err || !playlist_id) {
            console.log(p_err)
            return new Response("Playlist not found", {
                status: 404,
                headers: { 'Content-Type': 'text/html' }
            });
        } 
        // Code to reject playlist if playlist is not in party mode.
        // else if (!playlist.in_party_mode) {
        //     return new Response("Invalid Party Code", {
        //         status: 400,
        //         headers: { 'Content-Type': 'text/html' }
        //     });
        // }

        console.log("Playlist id : ", playlist_id)

        const { data: link_data, error: link_err } = await supabase
            .from('party_users')
            .upsert({ 'playlist_id': playlist_id });

        if (link_err) {
            console.log("link error", link_err);
            return new Response("Error linking playlist", {
                status: 400,
                headers: { 'Content-Type': 'text/html' }
            });
        }

        // No longer returning playlist from link 
        // const deserializedPlaylist = await deserializePlaylist(playlist, supabase);
        
        // if (!deserializedPlaylist) {
        //     console.log("Error deserializing playlist:", playlist.playlist_id);
        //     return new Response('Error Deserializing Playlist', {
        //         status: 500
        //     });
        // }

        return new Response(playlist_id.toString(), {
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