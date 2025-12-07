/*
    This file stores helper functions to interact directly with the testing database.
    Including functions to manage users and clear data.
*/

import { createSupabaseAdminClient } from "@/src/server/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { getRandomString } from "./random";

export async function createUser(email: string, password: string) {
    // Must use a new supabase client since this one will inherit the user's
    // session info, making its role now authenticated and not service role.
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password
    });

    if (error) {
        console.error('Error creating user:');
        console.error(error)
        return;
    }

    const { data: magicLink } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: email,
    });

    if (!magicLink?.properties?.hashed_token) {
        throw new Error("Failed to generate auth token");
    }

    // Verify OTP to create session
    const { data: verified } = await supabase.auth.verifyOtp({
        token_hash: magicLink.properties.hashed_token,
        type: 'email',
    });

    return verified; // have inside the session
}

// Creates a random user
export async function createRandomUser(rand: () => number) {
    const user_data = await createUser(getRandomString(rand, 10) + "@test.com", getRandomString(rand, 10))

    if (!user_data || !user_data.session || !user_data.user) {
        console.log(user_data);
        throw new Error('Error creating random user')
    }

    return {user: user_data.user, session: user_data.session};
}

// Clears the test database of all data besides the auth table
export async function clearDatabase(adminClient: SupabaseClient) {
    const { error: playlistSongError } = await adminClient
        .from('playlists_songs')
        .delete()
        .neq('song_id', 0);
    
    if (playlistSongError) {
        console.error('Error deleting playlists songs: ');
        console.error(playlistSongError);
        return;
    }

    const { error: playlistError } = await adminClient
        .from('playlists')
        .delete()
        .neq('playlist_id', 0);

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

export async function deleteAllUsers(adminClient: SupabaseClient) {
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