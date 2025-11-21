import { createSupabaseAdminClient } from "@/src/server/supabase";
import { clearDatabase, createUser, deleteAllUsers } from "./utils/database";
import { clear } from "console";
import { POST, POST as POST_PLAYLIST } from "@/src/app/api/playlist/+api";
import { isITunesPlaylist } from "@/src/types";
import { Session, User } from "@supabase/supabase-js";

describe('Test Backend', () => {
    const adminClient = createSupabaseAdminClient();
    
    // Shared user session and user data between all test
    // Can't create a new user for each test as the auth endpoints are rate limited
    let user: User;
    let session: Session;

    beforeAll(async () => {
        const user_data = await createUser(adminClient, 'test@test.com', '123456');
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


    describe('Testing loading correct env', () => {

        test('Supabase URL', () => {
            expect(process.env.EXPO_PUBLIC_SUPABASE_URL).toBe('https://xgmicqytifznusiwsaor.supabase.co');
        })
    });

    describe('Connected to Supabase', () => {

        beforeEach(async () => {
            await clearDatabase(adminClient)
        });

        test('Empty Database', async () => {
            const { data: playlists, error: pl_e } = await adminClient
                .from('playlists')
                .select();

            expect(pl_e).toBeNull();
            expect(playlists).toStrictEqual([]);

            const { data: playlists_songs, error: pls_e } = await adminClient
                .from('playlists_songs')
                .select();

            expect(pls_e).toBeNull();
            expect(playlists_songs).toStrictEqual([]);

            const { data: songs, error: s_e } = await adminClient
                .from('songs')
                .select();

            expect(s_e).toBeNull();
            expect(songs).toStrictEqual([]);

            const { data: profiles, error: p_e } = await adminClient
                .from('profiles')
                .select();

            expect(p_e).toBeNull();
            expect(profiles).toStrictEqual([]);
        });

        test('Adding Songs to Database', async () => {
            const fake_song ={
                    song_id: 12,
                    title: "test song",
                    artist: "fake artist",
                    preview_url: "example.com",
                    cover_url: "example.com",
                    duration_sec: 51
                };
            const {data: insert_data, error: insert_error} = await adminClient
                .from('songs')
                .upsert(fake_song)
                .select();
        
            expect(insert_error).toBeNull();
            
            const {data: select_data, error: select_error} = await adminClient
                .from('songs')
                .select()
                .eq('song_id', 12)
                .single();

            expect(select_error).toBeNull();
            expect(select_data).toStrictEqual(fake_song);
        });
    })

    describe("Testing Endpoint: POST 'api/playlist'", () => {
        beforeEach(async () => {
            await clearDatabase(adminClient)
        });

        test("Create Empty Playlist", async () => {

            const empty_playlist = {
                "id": 0, 
                "name": "An empty playlist", 
                "created_at": "", 
                "user_id": user.id, 
                "songs": [
                ]
            }

            const req = new Request("localhost:1234/api/playlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(empty_playlist)
            });
            expect(req).not.toBeNull();

            // Call post endpoint
            const res = await POST_PLAYLIST(req);
            const body = await res.json();
            expect(isITunesPlaylist(body)).toBeTruthy();

            const { data, error } = await adminClient
                .from('playlists')
                .select()
                .eq('name', empty_playlist.name)
                .single();
            
            expect(error).toBeNull();
            expect(data?.uid).toBe(body.user_id);
        });
    });
});

function delay(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}
