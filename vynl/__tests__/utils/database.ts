import { createSupabaseAdminClient } from "@/src/server/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

export async function createUser(adminClient: SupabaseClient, email: string, password: string) {
    const { data, error } = await adminClient.auth.admin.createUser({
        email: email,
        password: password
    });

    if (error) {
        console.error('Error creating user:');
        console.error(error)
        return;
    }

    const { data: magicLink } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: email,
    });

    if (!magicLink?.properties?.hashed_token) {
        throw new Error("Failed to generate auth token");
    }

    // Verify OTP to create session
    const { data: verified } = await adminClient.auth.verifyOtp({
        token_hash: magicLink.properties.hashed_token,
        type: 'email',
    });

    return verified; // have inside the session
    
    
}

// Clears the test database of all data
export async function clearDatabase(adminClient: SupabaseClient) {
    await deleteAllUsers(adminClient);

    const { error: playlistError } = await adminClient
        .from('playlists')
        .delete()
        .neq('name', '');
    
    if (playlistError) {
        console.error('Error deleting playlist: ');
        console.error(playlistError)
        return;
    }

    const { error: songError } = await adminClient
        .from('songs')
        .delete()
        .neq('song_id', 0);
    
    if (songError) {
        console.error('Error deleting songs: ');
        console.error(songError);
        return;
    }
    
    const { error: playlistSongError } = await adminClient
        .from('playlists_songs')
        .delete()
        .neq('song_id', 0);
    
    if (playlistSongError) {
        console.error('Error deleting playlists songs: ');
        console.error(playlistSongError);
        return;
    }

    const { error: profileError } = await adminClient
        .from('profiles')
        .delete()
        .neq('name', '');

    if (profileError) {
        console.error('Error deleting profiles: ');
        console.error(profileError);
        return;
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