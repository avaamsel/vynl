import { createSupabaseAdminClient } from "@/src/server/supabase";
import { clearDatabase, createUser, deleteAllUsers } from "./utils/database";
import { clear } from "console";
import { POST as POST_PLAYLIST, GET as GET_PLAYLISTS } from "@/src/app/api/playlist/+api";
import { GET as GET_PLAYLIST } from "@/src/app/api/playlist/[id]+api";
import { isITunesPlaylist, ITunesPlaylist } from "@/src/types";
import { Session, User } from "@supabase/supabase-js";
import { emitTypingEvents } from "@testing-library/react-native/build/user-event/type/type";

describe('Test Backend', () => {
    const adminClient = createSupabaseAdminClient();
    
    // Shared user session and user data between all test
    // Can't create a new user for each test as the auth endpoints are rate limited
    let user: User;
    let session: Session;

    beforeAll(async () => {
        await clearDatabase(adminClient);
        await deleteAllUsers(adminClient);
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

    describe("Endpoint: POST 'api/playlist'", () => {
        beforeEach(async () => {
            await clearDatabase(adminClient);
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

            const body = await addPlaylist(empty_playlist, session.access_token);
            
            const { data, error } = await adminClient
                .from('playlists')
                .select()
                .eq('name', empty_playlist.name)
                .single();
            
            expect(error).toBeNull();
            expect(data?.uid).toBe(body.user_id);
        });

        test("Create Filled Playlist", async () => {
            const filled_playlist = {
                "id": 0, 
                "name": "An empty playlist", 
                "created_at": "", 
                "user_id": user.id,
                "songs": [
                    { song_id: 12, title: "test song", artist: "fake artist", preview_url: "example.com", cover_url: "example.com", duration_sec: 51 },
                    { song_id: 42, title: "test song 2", artist: "abcd", preview_url: "test.com/abcd", cover_url: "test.com/abcd", duration_sec: 231 },
                    { song_id: 52, title: "test song 3", artist: "xyz", preview_url: "test.com/xyz", cover_url: "test.com/xyz", duration_sec: 192 }
                ]
            }

            const body = await addPlaylist(filled_playlist, session.access_token);

            const { data: playlist_data, error: playlist_error } = await adminClient
                .from('playlists')
                .select()
                .eq('name', filled_playlist.name)
                .single();
            
            expect(playlist_error).toBeNull();
            expect(playlist_data?.uid).toBe(body.user_id);

            const { data: songs_data, error: songs_error } = await adminClient
                .from('songs')
                .select();

            expect(songs_data).toBeDefined();
            expect(songs_error).toBeNull();
            for (let i = 0; i < songs_data!.length; i++) {
                let database_song = songs_data![i];
                let original_song = filled_playlist.songs.find(
                    song => song.song_id == database_song.song_id
                );
                expect(database_song).toStrictEqual(original_song);
            }
        });
    });

    describe("Endpoint: GET 'api/playlist'", () => {
        beforeEach(async () => {
            await clearDatabase(adminClient);
        });

        test('Get No Playlist', async () => {
            const req = new Request("localhost:1234/api/playlist", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                }
            });

            // Call get endpoint
            const res = await GET_PLAYLISTS(req);
            const body = await res.json();
            expect(body).toStrictEqual([]);
        });

        test('Get One Playlist', async () => {
            const filled_playlist = {
                "id": 0, 
                "name": "An empty playlist", 
                "created_at": "", 
                "user_id": user.id,
                "songs": [
                    { song_id: 12, title: "test song", artist: "fake artist", preview_url: "example.com", cover_url: "example.com", duration_sec: 51 },
                    { song_id: 42, title: "test song 2", artist: "abcd", preview_url: "test.com/abcd", cover_url: "test.com/abcd", duration_sec: 231 },
                    { song_id: 52, title: "test song 3", artist: "xyz", preview_url: "test.com/xyz", cover_url: "test.com/xyz", duration_sec: 192 }
                ]
            }

            const body1 = await addPlaylist(filled_playlist, session.access_token);

            const req2 = new Request("localhost:1234/api/playlist", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                }
            });
            expect(req2).not.toBeNull();

            const res2 = await GET_PLAYLISTS(req2);
            const body2 = await res2.json();
            expect(body2.length).toBe(1);
            expect(isITunesPlaylist(body2[0])).toBeTruthy();
            
            // Our playlists should be the same
            expect(body2[0]).toStrictEqual(body1);
        });

        test('Get Two Playlist', async () => {
            const playlist1 = {
                "id": 0, 
                "name": "Favorites", 
                "created_at": "", 
                "user_id": user.id,
                "songs": [
                    { song_id: 56, title: "Love Story", artist: "Taylor Swift", preview_url: "example.com", cover_url: "example.com", duration_sec: 125 },
                    { song_id: 2, title: "Lemon Tree", artist: "Mt. Joy", preview_url: "test.com/abcd", cover_url: "test.com/abcd", duration_sec: 70 },
                    { song_id: 29, title: "Song Names Are Hard", artist: "xyz", preview_url: "test.com/xyz", cover_url: "test.com/xyz", duration_sec: 213 }
                ]
            }

            const playlist2 = {
                "id": 0, 
                "name": "Not So Favorites", 
                "created_at": "", 
                "user_id": user.id,
                "songs": [
                    { song_id: 71, title: "test song 2", artist: "abcd", preview_url: "test.com/abcd", cover_url: "test.com/abcd", duration_sec: 231 },
                    { song_id: 51, title: "test song", artist: "fake artist", preview_url: "example.com", cover_url: "example.com", duration_sec: 51 },
                    { song_id: 4, title: "test song 3", artist: "xyz", preview_url: "test.com/xyz", cover_url: "test.com/xyz", duration_sec: 192 }
                ]
            }

            const body1 = await addPlaylist(playlist1, session.access_token);
            const body2 = await addPlaylist(playlist2, session.access_token);

            const req = new Request("localhost:1234/api/playlist", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                }
            });
            expect(req).not.toBeNull();

            const res = await GET_PLAYLISTS(req);
            const body = await res.json();
            expect(body.length).toBe(2);
            expect(isITunesPlaylist(body[0])).toBeTruthy();
            expect(isITunesPlaylist(body[1])).toBeTruthy();
            
            // Our playlists should be the same
            expect(body[0]).toStrictEqual(body1);
            expect(body[1]).toStrictEqual(body2);
        });
    });

    describe("Endpoint: GET 'api/playlist/:id'", async () => {
        beforeEach(async () => {
            await clearDatabase(adminClient);
        });

        test('Error: Get Nonexisting Playlist', async () => {
            const req = new Request("localhost:1234/api/playlist", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                }
            });

            // Call get endpoint
            const res = await GET_PLAYLISTS(req);
            const body = await res.json();
            expect(body).toStrictEqual([]);
        });

        test('Get One Playlist', async () => {
            const filled_playlist = {
                "id": 0, 
                "name": "An empty playlist", 
                "created_at": "", 
                "user_id": user.id,
                "songs": [
                    { song_id: 12, title: "test song", artist: "fake artist", preview_url: "example.com", cover_url: "example.com", duration_sec: 51 },
                    { song_id: 42, title: "test song 2", artist: "abcd", preview_url: "test.com/abcd", cover_url: "test.com/abcd", duration_sec: 231 },
                    { song_id: 52, title: "test song 3", artist: "xyz", preview_url: "test.com/xyz", cover_url: "test.com/xyz", duration_sec: 192 }
                ]
            }

            const body1 = await addPlaylist(filled_playlist, session.access_token);

            const req2 = new Request("localhost:1234/api/playlist", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                }
            });
            expect(req2).not.toBeNull();

            const res2 = await GET_PLAYLISTS(req2);
            const body2 = await res2.json();
            expect(body2.length).toBe(1);
            expect(isITunesPlaylist(body2[0])).toBeTruthy();
            
            // Our playlists should be the same
            expect(body2[0]).toStrictEqual(body1);
        });

        test('Get Two Playlist', async () => {
            const playlist1 = {
                "id": 0, 
                "name": "Favorites", 
                "created_at": "", 
                "user_id": user.id,
                "songs": [
                    { song_id: 56, title: "Love Story", artist: "Taylor Swift", preview_url: "example.com", cover_url: "example.com", duration_sec: 125 },
                    { song_id: 2, title: "Lemon Tree", artist: "Mt. Joy", preview_url: "test.com/abcd", cover_url: "test.com/abcd", duration_sec: 70 },
                    { song_id: 29, title: "Song Names Are Hard", artist: "xyz", preview_url: "test.com/xyz", cover_url: "test.com/xyz", duration_sec: 213 }
                ]
            }

            const playlist2 = {
                "id": 0, 
                "name": "Not So Favorites", 
                "created_at": "", 
                "user_id": user.id,
                "songs": [
                    { song_id: 71, title: "test song 2", artist: "abcd", preview_url: "test.com/abcd", cover_url: "test.com/abcd", duration_sec: 231 },
                    { song_id: 51, title: "test song", artist: "fake artist", preview_url: "example.com", cover_url: "example.com", duration_sec: 51 },
                    { song_id: 4, title: "test song 3", artist: "xyz", preview_url: "test.com/xyz", cover_url: "test.com/xyz", duration_sec: 192 }
                ]
            }

            const body1 = await addPlaylist(playlist1, session.access_token);
            const body2 = await addPlaylist(playlist2, session.access_token);

            const req = new Request("localhost:1234/api/playlist", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                }
            });
            expect(req).not.toBeNull();

            const res = await GET_PLAYLISTS(req);
            const body = await res.json();
            expect(body.length).toBe(2);
            expect(isITunesPlaylist(body[0])).toBeTruthy();
            expect(isITunesPlaylist(body[1])).toBeTruthy();
            
            // Our playlists should be the same
            expect(body[0]).toStrictEqual(body1);
            expect(body[1]).toStrictEqual(body2);
        });
    });
    

});

// Helper function to call the post playlist endpoint with playlist
async function addPlaylist(playlist: ITunesPlaylist, access_token: string): Promise<ITunesPlaylist> {
    const req = new Request("localhost:1234/api/playlist", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(playlist)
    });
    expect(req).not.toBeNull();

    // Call post endpoint
    const res = await POST_PLAYLIST(req);
    const body = await res.json();
    expect(isITunesPlaylist(body)).toBeTruthy();

    return body;
}