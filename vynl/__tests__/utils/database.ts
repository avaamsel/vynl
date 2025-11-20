import { SupabaseClient } from "@supabase/supabase-js";

// Clears the test database of all data
export async function clearDatabase(adminClient: SupabaseClient) {
    try {
        await deleteAllUsers(adminClient);

        const { error: playlistError } = await adminClient
            .from('playlist')
            .delete();
        
        if (playlistError) {
            console.error('Error deleting playlist: ' + playlistError);
            return;
        }

        const { error: songError } = await adminClient
            .from('songs')
            .delete();
        
        if (songError) {
            console.error('Error deleting songs: ' + songError);
            return;
        }
        
        const { error: playlistSongError } = await adminClient
            .from('playlists_songs')
            .delete();
        
        if (playlistSongError) {
            console.error('Error deleting playlists songs: ' + playlistSongError);
            return;
        }

        const { error: profileError } = await adminClient
            .from('profiles')
            .delete();

        if (profileError) {
            console.error('Error deleting profiles: ' + profileError);
            return;
        }
    } catch (error) {
        console.error('An unexpected error occurred:', error);
    }
}

async function deleteAllUsers(adminClient: SupabaseClient) {
    try {
        // Get all users (you might need pagination for a large number of users)
        const { data: users, error: listError } = await adminClient.auth.admin.listUsers();

        if (listError) {
            console.error('Error listing users:', listError);
            return;
        }

        for (const user of users.users) {
            const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
            if (deleteError) {
                console.error(`Error deleting user ${user.id}:`, deleteError);
            }
        }
    } catch (error) {
        console.error('An unexpected error occurred:', error);
    }
}