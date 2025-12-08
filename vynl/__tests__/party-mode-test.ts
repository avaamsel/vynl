import { createSupabaseAdminClient } from "@/src/server/supabase";
import { clearDatabase, createUser, deleteAllUsers } from "./utils/database";
import { POST as POST_PLAYLIST, GET as GET_PLAYLISTS } from "@/src/app/api/playlist/+api";
import { GET as GET_PLAYLIST, PUT as PUT_PLAYLIST} from "@/src/app/api/playlist/[id]+api";
import { isITunesPlaylist, ITunesPlaylist } from "@/src/types";
import { Session, User } from "@supabase/supabase-js";

describe('Playlist Test', () => {
    const adminClient = createSupabaseAdminClient();
    
    // Shared user session and user data between all test
    // Can't create a new user for each test as the auth endpoints are rate limited
    let user: User;
    let session: Session;

    beforeAll(async () => {
        // Make sure database we are running on a clean database.
        await clearDatabase(adminClient);
        await deleteAllUsers(adminClient);

        // Construct a user in the database
        const user_data = await createUser('test@test.com', '123456');
        if (user_data == null || user_data.user == null || user_data.session == null) {
            console.error('Error creating user');
            return;
        }
        user = user_data.user;
        session = user_data.session;
    });

    afterAll(async () => {
        clearDatabase(adminClient);
        deleteAllUsers(adminClient);
    })

    test('Fake Test', () => {
        return;
    })

});