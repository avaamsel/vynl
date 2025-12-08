import { createSupabaseAdminClient } from "@/src/server/supabase";
import { clearDatabase, createUser, deleteAllUsers } from "./utils/database";
import { POST as POST_PLAYLIST, GET as GET_PLAYLISTS } from "@/src/app/api/playlist/+api";
import { GET as GET_PLAYLIST, PUT as PUT_PLAYLIST} from "@/src/app/api/playlist/[id]+api";
import { PUT as ADD_TO_PLAYLIST } from "@/src/app/api/playlist/add/[id]+api";
import { isITunesPlaylist } from "@/src/types";
import { Session, User } from "@supabase/supabase-js";
import { getPlaylist, addPlaylist, createAddReq } from "./utils/api";

jest.setTimeout(10000);

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


    describe('Testing loading correct env', () => {
        test('Supabase URL', () => {
            expect(process.env.EXPO_PUBLIC_SUPABASE_URL).toBe('https://xgmicqytifznusiwsaor.supabase.co');
        })
    });

    describe('Connected to Supabase', () => {
        afterEach(async () => {
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
        afterEach(async () => {
            await clearDatabase(adminClient);
        });

        test('Missing access token', async () => {
            const empty_playlist = {
                "id": 0, 
                "name": "An empty playlist", 
                "created_at": "", 
                "user_id": user.id, 
                "songs": [
                ]
            }

            const req1 = new Request("localhost:1234/api/playlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(empty_playlist)
            });

            // Call post endpoint with no token, expect an error
            const res1 = await POST_PLAYLIST(req1);
            expect(res1.ok).not.toBeTruthy();

            const req2 = new Request("localhost:1234/api/playlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer NotToken`,
                },
                body: JSON.stringify(empty_playlist)
            });

            // Call post endpoint with wrong token, expect an error
            const res2 = await POST_PLAYLIST(req2);
            expect(res2.ok).not.toBeTruthy();
        });

        test("Create empty playlist", async () => {
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

        test("Create filled playlist", async () => {
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

            console.log(songs_data);

            expect(songs_data).toBeDefined();
            expect(songs_error).toBeNull();
            for (let i = 0; i < filled_playlist.songs.length; i++) {
                let original_song = filled_playlist.songs[i];
                let database_song = songs_data?.find(
                    s => s.song_id == original_song.song_id
                );
                expect(database_song).toStrictEqual(original_song);
            }
        });
    });

    describe("Endpoint: GET 'api/playlist'", () => {
        afterEach(async () => {
            await clearDatabase(adminClient);
        });

        test('Missing access token', async () => {
            const req1 = new Request("localhost:1234/api/playlist", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            // Call get endpoint with no token, expect an error
            const res1 = await GET_PLAYLISTS(req1);
            expect(res1.ok).not.toBeTruthy();

            const req2 = new Request("localhost:1234/api/playlist", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer NotToken`,
                }
            });

            // Call get endpoint with wrong token, expect an error
            const res2 = await GET_PLAYLISTS(req2);
            expect(res2.ok).not.toBeTruthy();
        });

        test('Get no playlist', async () => {
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

        test('Get one playlist', async () => {
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

        test('Get two playlist', async () => {
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

    describe("Endpoint: GET 'api/playlist/:id'", () => {
        afterEach(async () => {
            await clearDatabase(adminClient);
        });

        test('Missing access token', async () => {
            const req1 = new Request("localhost:1234/api/playlist/21", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            // Call get endpoint, expect an error
            const res1 = await GET_PLAYLIST(req1, { id:"21" });
            expect(res1.ok).not.toBeTruthy();

            const req2 = new Request("localhost:1234/api/playlist/21", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer NotToken`,
                }
            });

            // Call get endpoint, expect an error
            const res2 = await GET_PLAYLIST(req2, { id:"21" });
            expect(res2.ok).not.toBeTruthy();
        });

        test('Get nonexisting playlist', async () => {
            const req = new Request("localhost:1234/api/playlist/21", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                }
            });

            // Call get endpoint, expect an error
            const res = await GET_PLAYLIST(req, { id:"21" });
            expect(res.ok).not.toBeTruthy();
        });

        test('Add one playlist then get playlist', async () => {
            const playlist = {
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

            const body1 = await addPlaylist(playlist, session.access_token);

            const req2 = new Request("localhost:1234/api/playlist/" + body1.id, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                }
            });
            expect(req2).not.toBeNull();

            const res2 = await GET_PLAYLIST(req2, { id:body1.id.toString() });
            const body2 = await res2.json();
            expect(isITunesPlaylist(body2)).toBeTruthy();
            
            // Our playlists should be the same
            expect(body2).toStrictEqual(body1);
        });

        test('Add two playlist then get a playlist', async () => {
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

            /// Add playlist to database
            const created_playlist1 = await addPlaylist(playlist1, session.access_token);
            const created_playlist2 = await addPlaylist(playlist2, session.access_token);

            const req = new Request("localhost:1234/api/playlist/" + created_playlist1.id, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                }
            });

            const res = await GET_PLAYLIST(req, { id:created_playlist1.id.toString() });
            const body = await res.json();
            expect(isITunesPlaylist(body)).toBeTruthy();
            
            // Our playlists should be the same
            expect(body).toStrictEqual(created_playlist1);
        });
    });
    
    describe("Endpoint: PUT 'api/playlist/:id'", () => {
        beforeEach(async () => {
            await clearDatabase(adminClient);
        });

        test('Missing access token', async () => {
            const playlist = {
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
            const { id } = await addPlaylist(playlist, session.access_token);

            // Missing access token
            const req1 = new Request("localhost:1234/api/playlist/" + id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(playlist)
            });

            // Call put endpoint, expect an error
            const res1 = await PUT_PLAYLIST(req1, { id:id.toString() });
            expect(res1.ok).not.toBeTruthy();

            // Bad access token
            const req2 = new Request("localhost:1234/api/playlist/" + id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer NotToken`,
                },
                body: JSON.stringify(playlist)
            });

            // Call put endpoint, expect an error
            const res2 = await GET_PLAYLIST(req2, { id:"21" });
            expect(res2.ok).not.toBeTruthy();
        });

        test('Add songs to playlist', async () => {
            const playlist = {
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

            const new_playlist = await addPlaylist(playlist, session.access_token);

            // Add song to the playlist
            new_playlist.songs.push({
                song_id: 612,
                title: "test song 4",
                artist: "twinkie",
                preview_url: "test.com/twinkie",
                cover_url: "test.com/cover/twinkie",
                duration_sec: 220
            });
            // Change name of playlist
            new_playlist.name = "New name";

            // Make request to PUT endpoint
            const req = new Request("localhost:1234/api/playlist/" + new_playlist.id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(new_playlist)
            });
            const res = await PUT_PLAYLIST(req, { id: new_playlist.id.toString() });
            expect(res.ok).toBeTruthy();
            const body = await res.json();

            expect(body.name).toBe(playlist.name);
            expect(body.songs).toEqual(playlist.songs);

            // Get the changed playlist in the database and check it against what we wanted to push.
            const changed_playlist = await getPlaylist(new_playlist.id, session.access_token);
            expect(changed_playlist).toEqual(new_playlist);
        });

        test('Remove songs from playlist', async () => {
            const playlist = {
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

            const new_playlist = await addPlaylist(playlist, session.access_token);

            // Removes song from playlist
            new_playlist.songs.pop();

            // Make request to PUT endpoint
            const req = new Request("localhost:1234/api/playlist/" + new_playlist.id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(new_playlist)
            });
            const res = await PUT_PLAYLIST(req, { id: new_playlist.id.toString() });
            expect(res.ok).toBeTruthy();
            const body = await res.json();

            expect(body.name).toBe(playlist.name);
            expect(body.songs).toEqual(playlist.songs);

            // Get the changed playlist in the database and check it against what we wanted to push.
            const changed_playlist = await getPlaylist(new_playlist.id, session.access_token);
            expect(changed_playlist).toEqual(new_playlist);
        });

        test('Change order of songs in playlist', async () => {
            const playlist = {
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

            const new_playlist = await addPlaylist(playlist, session.access_token);

            // Change order of songs in playlist
            const temp_song = new_playlist.songs[0];
            new_playlist.songs[0] = new_playlist.songs[1];
            new_playlist.songs[1] = temp_song;

            // Make request to PUT endpoint
            const req = new Request("localhost:1234/api/playlist/" + new_playlist.id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(new_playlist)
            });
            const res = await PUT_PLAYLIST(req, { id: new_playlist.id.toString() });
            expect(res.ok).toBeTruthy();
            const body = await res.json();

            expect(body.name).toBe(playlist.name);
            expect(body.songs).toEqual(playlist.songs);

            // Get the changed playlist in the database and check it against what we wanted to push.
            const changed_playlist = await getPlaylist(new_playlist.id, session.access_token);
            expect(changed_playlist).toStrictEqual(new_playlist);
        });
    });

    describe("Endpoint: PUT 'api/playlist/add/:id'", () => {
        afterEach(async () => {
            await clearDatabase(adminClient);
        });

        test('Missing access token', async () => {
            const playlist = {
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
            const extra_song = { song_id: 391, title: "test song 4", artist: "xyz", preview_url: "test.com/xyz", cover_url: "test.com/xyz", duration_sec: 1932 }
            const { id } = await addPlaylist(playlist, session.access_token);

            // Missing access token
            const req1 = new Request("localhost:1234/api/playlist/add/" + id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify([extra_song])
            });

            // Call put endpoint, expect an error
            const res1 = await ADD_TO_PLAYLIST(req1, { id:id.toString() });
            expect(res1.ok).not.toBeTruthy();

            // Bad access token
            const req2 = new Request("localhost:1234/api/playlist/" + id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer NotToken`,
                },
                body: JSON.stringify([extra_song])
            });

            // Call put endpoint, expect an error
            const res2 = await GET_PLAYLIST(req2, { id:"21" });
            expect(res2.ok).not.toBeTruthy();
        });

        test("Add to empty playlist", async () => {
            const playlist = {
                "id": 0, 
                "name": "An empty playlist", 
                "created_at": "", 
                "user_id": user.id,
                "songs": [
                ]
            }

            const songs_to_add = [
                { song_id: 12, title: "test song", artist: "fake artist", preview_url: "example.com", cover_url: "example.com", duration_sec: 51 },
                { song_id: 42, title: "test song 2", artist: "abcd", preview_url: "test.com/abcd", cover_url: "test.com/abcd", duration_sec: 231 },
                { song_id: 52, title: "test song 3", artist: "xyz", preview_url: "test.com/xyz", cover_url: "test.com/xyz", duration_sec: 192 }
            ]

            const { id } = await addPlaylist(playlist, session.access_token);

            // Add the first song to the playlist
            const req1 = createAddReq(id, songs_to_add.slice(0, 1), session.access_token);

            const res1 = await ADD_TO_PLAYLIST(req1, { id:id.toString() });
            expect(res1.ok).toBeTruthy();
            let new_playlist = await getPlaylist(id, session.access_token);

            expect(new_playlist.songs).toEqual(songs_to_add.slice(0,1));

            const req2 = createAddReq(id, songs_to_add.slice(1, 3), session.access_token);

            // Add the next two
            const res2 = await ADD_TO_PLAYLIST(req2, { id:id.toString() });
            expect(res2.ok).toBeTruthy();
            new_playlist = await getPlaylist(id, session.access_token);

            expect(new_playlist.songs).toEqual(songs_to_add);
        });

        test("Add to non-empty playlist", async () => {
            const playlist = {
                "id": 0, 
                "name": "An empty playlist", 
                "created_at": "", 
                "user_id": user.id,
                "songs": [
                    { song_id: 1, title: "existing song 1", artist: "fake artist", preview_url: "example.com", cover_url: "example.com", duration_sec: 51 },
                    { song_id: 1041, title: "existing song 2", artist: "fake artist", preview_url: "example.com", cover_url: "example.com", duration_sec: 34 },
                ]
            }

            const songs_to_add = [
                { song_id: 12, title: "test song", artist: "fake artist", preview_url: "example.com", cover_url: "example.com", duration_sec: 51 },
                { song_id: 42, title: "test song 2", artist: "abcd", preview_url: "test.com/abcd", cover_url: "test.com/abcd", duration_sec: 231 },
                { song_id: 52, title: "test song 3", artist: "xyz", preview_url: "test.com/xyz", cover_url: "test.com/xyz", duration_sec: 192 }
            ]

            const { id } = await addPlaylist(playlist, session.access_token);

            // Add the first song to the playlist
            const req1 = createAddReq(id, songs_to_add.slice(0, 1), session.access_token);

            const res1 = await ADD_TO_PLAYLIST(req1, { id:id.toString() });
            expect(res1.ok).toBeTruthy();
            let new_playlist = await getPlaylist(id, session.access_token);

            expect(new_playlist.songs).toEqual([...playlist.songs, ...songs_to_add.slice(0,1)]);

            const req2 = createAddReq(id, songs_to_add.slice(1, 3), session.access_token);

            // Add the next two
            const res2 = await ADD_TO_PLAYLIST(req2, { id:id.toString() });
            expect(res2.ok).toBeTruthy();
            new_playlist = await getPlaylist(id, session.access_token);

            expect(new_playlist.songs).toEqual([...playlist.songs, ...songs_to_add]);
        });

        test("Add existing song", async () => {
            const playlist = {
                "id": 0, 
                "name": "An empty playlist", 
                "created_at": "", 
                "user_id": user.id,
                "songs": [
                    { song_id: 1, title: "existing song 1", artist: "fake artist", preview_url: "example.com", cover_url: "example.com", duration_sec: 51 },
                    { song_id: 1041, title: "existing song 2", artist: "fake artist", preview_url: "example.com", cover_url: "example.com", duration_sec: 34 },
                ]
            }

            const songs_to_add1 = [
                { song_id: 1, title: "existing song 1", artist: "fake artist", preview_url: "example.com", cover_url: "example.com", duration_sec: 51 },
            ]

            const songs_to_add2 = [
                { song_id: 42, title: "test song 2", artist: "abcd", preview_url: "test.com/abcd", cover_url: "test.com/abcd", duration_sec: 231 },
                { song_id: 1, title: "existing song 1", artist: "fake artist", preview_url: "example.com", cover_url: "example.com", duration_sec: 51 },
                { song_id: 52, title: "test song 3", artist: "xyz", preview_url: "test.com/xyz", cover_url: "test.com/xyz", duration_sec: 192 }
            ]

            const { id } = await addPlaylist(playlist, session.access_token);

            // Add the first song to the playlist
            const req1 = createAddReq(id, songs_to_add1, session.access_token);

            const res1 = await ADD_TO_PLAYLIST(req1, { id:id.toString() });
            expect(res1.ok).toBeTruthy();
            let new_playlist = await getPlaylist(id, session.access_token);

            expect(new_playlist.songs).toEqual(playlist.songs);

            const req2 = createAddReq(id, songs_to_add2, session.access_token);

            // Add the next two
            const res2 = await ADD_TO_PLAYLIST(req2, { id:id.toString() });
            expect(res2.ok).toBeTruthy();
            new_playlist = await getPlaylist(id, session.access_token);

            expect(new_playlist.songs).toEqual([...playlist.songs, songs_to_add2[0], songs_to_add2[2]]);
        });
    });
});