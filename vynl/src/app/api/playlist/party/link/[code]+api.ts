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

        const { data: playlist, error: p_err } = await supabase
            .from('playlists')
            .select('*')
            .eq('party_code', code)
            .single();

        if (!playlist) {
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

        const { data: link_data, error: link_err } = await supabase
            .from('party_user')
            .insert({ 'playlist_id': playlist.playlist_id });

        if (link_err) {
            console.log(link_err);
            return new Response("Error linking playlist", {
                status: 400,
                headers: { 'Content-Type': 'text/html' }
            });
        }

        const deserializedPlaylist = await deserializePlaylist(playlist, supabase);
        
        if (!deserializedPlaylist) {
            console.log("Error deserializing playlist:", playlist.playlist_id);
            return new Response('Error Deserializing Playlist', {
                status: 500
            });
        }

        return new Response(JSON.stringify(deserializePlaylist), {
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