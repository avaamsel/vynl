import { createSupabaseAdminClient } from "@/src/server/supabase";
import { clearDatabase, createRandomUser, createUser, deleteAllUsers } from "./utils/database";
import { PUT as TOGGLE_PLAYLIST } from "@/src/app/api/playlist/party/toggle/[id]+api";
import { PUT as LINK_PLAYLIST } from "@/src/app/api/playlist/party/link/[code]+api";
import { PUT as UNLINK_PLAYLIST } from "@/src/app/api/playlist/party/unlink/[id]+api";
import { GET as GET_PLAYLIST, PUT as PUT_PLAYLIST} from "@/src/app/api/playlist/[id]+api";
import { Session, User } from "@supabase/supabase-js";
import { getPlaylist, addPlaylist, createToggleReq, togglePlaylist, createLinkReq, linkPlaylist, createUnlinkReq, getPlaylists, unlinkPlaylist, createGetReq } from "./utils/api";
import { makeSeededRand } from "./utils/random";
import { createRandomPlaylist, testEqualPlaylist } from "./utils/playlist";
import { ITunesPlaylist } from "@/src/types";

jest.setTimeout(10000);

describe('Party Playlist Test', () => {
    const adminClient = createSupabaseAdminClient();
    
    // Shared user session and user data between all test
    // Can't create a new user for each test as the auth endpoints are rate limited
    let user: User;
    let session: Session;

    // Shared list of users for testing party functionality
    let party_users: User[] = [];
    let party_sessions: Session[] = [];
    let party_size = 5;

    // Shared seeded random number generator
    // NOT concurrent use safe. However, since everything is run synchronously no race
    // conditions should be encountered.
    let rand: () => number;

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

        rand = makeSeededRand("Huskies");

        for (let i = 0; i < party_size; i++) {
            const user_data = await createRandomUser(rand);
            party_users.push(user_data.user);
            party_sessions.push(user_data.session);
        }
    });

    afterAll(async () => {
        clearDatabase(adminClient);
        deleteAllUsers(adminClient);
    })

    describe("Endpoint: PUT 'api/playlist/party/toggle/:id'", () => {
        afterEach(async () => {
            await clearDatabase(adminClient);
        });

        test('Single owned playlist toggled', async () => {
            const playlist = createRandomPlaylist(rand, user.id, 5);
            const { id } = await addPlaylist(playlist, session.access_token);
            
            const req1 = createToggleReq(id, true, session.access_token);
            const res1 = await TOGGLE_PLAYLIST(req1, { id: id.toString() });

            if (!res1.ok) {
                console.log(await res1.text());
            }

            expect(res1.ok).toBeTruthy();
            const party_code = await res1.text();
            expect(party_code.length).toBe(6);

            const { data: e_data, error: e_err } = await adminClient
                .from('playlists')
                .select()
                .eq('playlist_id', id)
                .single();
            
            expect(e_err).toBeNull();
            expect(e_data).not.toBeNull();
            expect(e_data?.party_code).toBe(party_code);
            expect(e_data?.in_party_mode).toBeTruthy();

            // Toggle party off
            const req2 = createToggleReq(id, false, session.access_token);
            const res2 = await TOGGLE_PLAYLIST(req2, { id: id.toString() });

            expect(res2.ok).toBeTruthy();

            const { data: d_data, error: d_err } = await adminClient
                .from('playlists')
                .select()
                .eq('playlist_id', id)
                .single();

            expect(d_err).toBeNull();
            expect(d_data).not.toBeNull();
            expect(d_data?.party_code).toBe(party_code);
            expect(d_data?.in_party_mode).not.toBeTruthy();
        });

        test('Multiple owned playlist toggled', async () => {
            const playlist = createRandomPlaylist(rand, user.id, 5);
            const { id } = await addPlaylist(playlist, session.access_token);
            for (let i = 0; i < 5; i++) {
                await addPlaylist(createRandomPlaylist(rand, user.id, 5), session.access_token);
            }
            
            const req1 = createToggleReq(id, true, session.access_token);
            const res1 = await TOGGLE_PLAYLIST(req1, { id: id.toString() });

            if (!res1.ok) {
                console.log(await res1.text());
            }

            expect(res1.ok).toBeTruthy();
            const party_code = await res1.text();
            expect(party_code.length).toBe(6);

            const { data: e_data, error: e_err } = await adminClient
                .from('playlists')
                .select()
                .eq('playlist_id', id)
                .single();
            
            expect(e_err).toBeNull();
            expect(e_data).not.toBeNull();
            expect(e_data?.party_code).toBe(party_code);
            expect(e_data?.in_party_mode).toBeTruthy();

            // Toggle party off
            const req2 = createToggleReq(id, false, session.access_token);
            const res2 = await TOGGLE_PLAYLIST(req2, { id: id.toString() });

            expect(res2.ok).toBeTruthy();

            const { data: d_data, error: d_err } = await adminClient
                .from('playlists')
                .select()
                .eq('playlist_id', id)
                .single();

            expect(d_err).toBeNull();
            expect(d_data).not.toBeNull();
            expect(d_data?.party_code).toBe(party_code);
            expect(d_data?.in_party_mode).not.toBeTruthy();
        }, 15000);

        test('Disable a disabled playlist', async () => {
            const playlist = createRandomPlaylist(rand, user.id, 5);
            const { id } = await addPlaylist(playlist, session.access_token);
            
            // Toggle playlist, but having enable false
            const req = createToggleReq(id, false, session.access_token);
            const res = await TOGGLE_PLAYLIST(req, { id: id.toString() });

            if (!res.ok) {
                console.log(await res.text());
            }

            expect(res.ok).toBeTruthy();

            const { data: e_data, error: e_err } = await adminClient
                .from('playlists')
                .select()
                .eq('playlist_id', id)
                .single();
            
            expect(e_err).toBeNull();
            expect(e_data).not.toBeNull();
            expect(e_data?.party_code).toBeNull();
            expect(e_data?.in_party_mode).not.toBeTruthy();
        });

        test('Enable a enabled playlist', async () => {
            const playlist = createRandomPlaylist(rand, user.id, 5);
            const { id } = await addPlaylist(playlist, session.access_token);
            
            // Toggle playlist
            const party_code = await togglePlaylist(id, true, session.access_token);
            
            // Toggle playlist again, should not change anything
            const req = createToggleReq(id, true, session.access_token);
            const res = await TOGGLE_PLAYLIST(req, { id: id.toString() });

            if (!res.ok) {
                console.log(await res.text());
            }

            expect(res.ok).toBeTruthy();

            const { data: e_data, error: e_err } = await adminClient
                .from('playlists')
                .select()
                .eq('playlist_id', id)
                .single();
            
            expect(e_err).toBeNull();
            expect(e_data).not.toBeNull();
            expect(e_data?.party_code).toBe(party_code);
            expect(e_data?.in_party_mode).toBeTruthy();
        })
    });

    describe("Endpoint: PUT 'api/playlist/party/link/:code", () => {
        afterEach(async () => {
            await clearDatabase(adminClient);
        });

        test('Link one user to party', async () => {
            // Set up party playlist
            const playlist = createRandomPlaylist(rand, user.id, 5);
            const { id } = await addPlaylist(playlist, session.access_token);
            const party_code = await togglePlaylist(id, true, session.access_token);

            // Link party user 0 with playlist
            const req = createLinkReq(party_code, party_sessions[0].access_token);
            const res = await LINK_PLAYLIST(req, { code: party_code });

            if (!res.ok) {
                console.log(await res.text());
            }
            expect(res.ok).toBeTruthy();
            expect(parseInt(await res.text())).toBe(id);

            const { data, error } = await adminClient
                .from('party_users')
                .select()
                .eq('playlist_id', id)
                .eq('user_id', party_users[0].id)
                .single();
            
            expect(error).toBeNull();
        });

        test('Link many users to party', async () => {
             // Set up party playlist
            const playlist = createRandomPlaylist(rand, user.id, 5);
            const { id } = await addPlaylist(playlist, session.access_token);
            const party_code = await togglePlaylist(id, true, session.access_token);

            for (let i = 0; i < Math.min(party_size, 3); i++) {
                 // Link party user with playlist
                const req = createLinkReq(party_code, party_sessions[i].access_token);
                const res = await LINK_PLAYLIST(req, { code: party_code });

                if (!res.ok) {
                    console.log(await res.text());
                }
                expect(res.ok).toBeTruthy();
                expect(parseInt(await res.text())).toBe(id);
            }

            const { data: party_data, error } = await adminClient
                .from('party_users')
                .select()
                .eq('playlist_id', id);
            
            expect(error).toBeNull();
            for (let i = 0; i < Math.min(party_size, 3); i++) {
                let row = party_data?.find(r => r.user_id == party_users[i].id);

                expect(row).toBeDefined();
                expect(row).toEqual({ playlist_id: id, user_id: party_users[i].id});
            }
        });

        test('Link user to already linked playlist', async () => {
            // Set up party playlist
            const playlist = createRandomPlaylist(rand, user.id, 5);
            const { id } = await addPlaylist(playlist, session.access_token);
            const party_code = await togglePlaylist(id, true, session.access_token);

            // Link party user 0 with playlist
            const link_id_1 = await linkPlaylist(party_code, party_sessions[0].access_token);
            expect(parseInt(link_id_1)).toBe(id);

            const { data: _, error: err1 } = await adminClient
                .from('party_users')
                .select()
                .eq('playlist_id', id)
                .eq('user_id', party_users[0].id)
                .single();
            
            expect(err1).toBeNull();

            // Link party user 0 with playlist again, expect no change
            const link_id_2 = await linkPlaylist(party_code, party_sessions[0].access_token);
            expect(parseInt(link_id_1)).toBe(id);

            const { data:__, error: err2 } = await adminClient
                .from('party_users')
                .select()
                .eq('playlist_id', id)
                .eq('user_id', party_users[0].id)
                .single();
            
            expect(err2).toBeNull();
        });

        test('Link to non-party playlist', async () => {
            // Set up party playlist
            const playlist = createRandomPlaylist(rand, user.id, 5);
            const { id } = await addPlaylist(playlist, session.access_token);
            const party_code = await togglePlaylist(id, true, session.access_token);
            // Playlist is now not party mode anymore
            await togglePlaylist(id, false, session.access_token);

            // Link party user 0 with playlist
            const req = createLinkReq(party_code, party_sessions[0].access_token);
            const res = await LINK_PLAYLIST(req, { code: party_code });

            expect(res.ok).not.toBeTruthy();
            expect(parseInt(await res.text())).not.toBe(id);

            const { data, error } = await adminClient
                .from('party_users')
                .select()
                .eq('playlist_id', id)
                .eq('user_id', party_users[0].id)
                .single();
            
            expect(error).not.toBeNull();
        })
    });

    describe("Endpoint: PUT 'api/playlist/party/unlink/:code", () => {
        afterEach(async () => {
            await clearDatabase(adminClient);
        });

        test('Unlink one user', async () => {
            // Set up party playlist
            const playlist = createRandomPlaylist(rand, user.id, 5);
            const { id } = await addPlaylist(playlist, session.access_token);
            const party_code = await togglePlaylist(id, true, session.access_token);

            // Link party user 0 with playlist
            await linkPlaylist(party_code, party_sessions[0].access_token);

            // Unlink user
            const req = createUnlinkReq(id, party_sessions[0].access_token);
            const res = await UNLINK_PLAYLIST(req, { id: id.toString() });

            expect(res.ok).toBeTruthy();

            const { data, error } = await adminClient
                .from('party_users')
                .select()
                .eq('playlist_id', id)
                .eq('user_id', party_users[0].id);
            
            expect(error).toBeNull();
            expect(data!.length).toBe(0);
        });

        test('Unlink non-linked user', async () => {
            // Set up party playlist
            const playlist = createRandomPlaylist(rand, user.id, 5);
            const { id } = await addPlaylist(playlist, session.access_token);
            const party_code = await togglePlaylist(id, true, session.access_token);

            // Unlink user without ever linking them
            const req = createUnlinkReq(id, party_sessions[0].access_token);
            const res = await UNLINK_PLAYLIST(req, { id: id.toString() });

            expect(res.ok).not.toBeTruthy();

            const { data, error } = await adminClient
                .from('party_users')
                .select()
                .eq('playlist_id', id)
                .eq('user_id', party_users[0].id);
            
            expect(error).toBeNull();
            expect(data!.length).toBe(0);
        });
    });

    /*
        The Follow are non-party endpoints being testing on party playlists
    */

    describe("Endpoint: GET 'api/playlist'", () => {
        afterEach(async () => {
            await clearDatabase(adminClient);
        });

        test('Get party playlists with mixed library', async () => {
            const party_playlist = createRandomPlaylist(rand, user.id, 1);
            const { id } = await addPlaylist(party_playlist, session.access_token);
            const party_code = await togglePlaylist(id, true, session.access_token);
            await linkPlaylist(party_code, party_sessions[0].access_token);

            const playlists: ITunesPlaylist[] = [];
            for (let i = 0; i < 3; i++) {
                playlists.push(await addPlaylist(
                    createRandomPlaylist(rand, party_users[0].id, 2), 
                    party_sessions[0].access_token)
                );
            }

            // Get party playlists
            const returned_playlists = await getPlaylists(party_sessions[0].access_token, true, party_users[0].id);

            // Check it matches the one party we are in
            expect(returned_playlists.length).toBe(1);
            const r_playlist = returned_playlists[0];
            expect(r_playlist.id).toBe(id);
            testEqualPlaylist(r_playlist, party_playlist);
        });

        test('Get party playlist with party mode off', async () => {
            const party_playlist = createRandomPlaylist(rand, user.id, 1);
            const { id } = await addPlaylist(party_playlist, session.access_token);
            const party_code = await togglePlaylist(id, true, session.access_token);
            await linkPlaylist(party_code, party_sessions[0].access_token);
            await togglePlaylist(id, false, session.access_token);


            const playlists: ITunesPlaylist[] = [];
            for (let i = 0; i < 3; i++) {
                playlists.push(await addPlaylist(
                    createRandomPlaylist(rand, party_users[0].id, 2), 
                    party_sessions[0].access_token)
                );
            }

            // Get party playlists
            const returned_playlists = await getPlaylists(party_sessions[0].access_token, true, party_users[0].id);

            // Check it matches the one party we are in
            expect(returned_playlists.length).toBe(1);
            const r_playlist = returned_playlists[0];
            expect(r_playlist.id).toBe(id);
            testEqualPlaylist(r_playlist, party_playlist);
        })

        test('Get non-party playlist with mixed library', async () => {
            const party_playlist = createRandomPlaylist(rand, user.id, 1);
            const { id } = await addPlaylist(party_playlist, session.access_token);
            const party_code = await togglePlaylist(id, true, session.access_token);
            await linkPlaylist(party_code, party_sessions[0].access_token);

            const playlists: ITunesPlaylist[] = [];
            for (let i = 0; i < 3; i++) {
                playlists.push(await addPlaylist(
                    createRandomPlaylist(rand, party_users[0].id, 2), 
                    party_sessions[0].access_token)
                );
            }

            // Get party playlists
            const returned_playlists = await getPlaylists(party_sessions[0].access_token, false, party_users[0].id);

            // Check it matches the one party we are in
            expect(returned_playlists.length).toBe(3);
            for (let i = 0; i < 3; i++) {
                let original_playlist = playlists[i];
                let r_playlist = returned_playlists.find(
                    pl => pl.id == original_playlist.id
                )
                
                expect(r_playlist).toBeDefined();
                testEqualPlaylist(original_playlist, r_playlist!);
            }
        });

        test('Get all playlist with mixed library', async () => {
            const party_playlist = createRandomPlaylist(rand, user.id, 1);
            const { id } = await addPlaylist(party_playlist, session.access_token);
            const party_code = await togglePlaylist(id, true, session.access_token);
            await linkPlaylist(party_code, party_sessions[0].access_token);

            const playlists: ITunesPlaylist[] = [];
            for (let i = 0; i < 3; i++) {
                playlists.push(await addPlaylist(
                    createRandomPlaylist(rand, party_users[0].id, 2), 
                    party_sessions[0].access_token)
                );
            }

            // Get party playlists
            const returned_playlists = await getPlaylists(party_sessions[0].access_token, false);

            // Check it matches the one party we are in
            expect(returned_playlists.length).toBe(4);
            for (let i = 0; i < 3; i++) {
                let original_playlist = playlists[i];
                let r_playlist = returned_playlists.find(
                    pl => pl.id == original_playlist.id
                )
                
                expect(r_playlist).toBeDefined();
                testEqualPlaylist(original_playlist, r_playlist!);
            }
            let r_playlist = returned_playlists.find(
                pl => pl.id == id
            )
            expect(r_playlist).toBeDefined();
            testEqualPlaylist(party_playlist, r_playlist!);
        })
    });

    describe("Endpoint: GET 'api/playlist/:id'", () => {
        afterEach(async () => {
            await clearDatabase(adminClient);
        });

        test('Get party playlist', async () => {
            const party_playlist = createRandomPlaylist(rand, user.id, 1);
            const { id } = await addPlaylist(party_playlist, session.access_token);
            const party_code = await togglePlaylist(id, true, session.access_token);
            await linkPlaylist(party_code, party_sessions[0].access_token);

            const returned_playlists = await getPlaylist(id, party_sessions[0].access_token);
            testEqualPlaylist(party_playlist, returned_playlists);
        });

        test('Get party playlist with party mode off', async () => {
            const party_playlist = createRandomPlaylist(rand, user.id, 1);
            const { id } = await addPlaylist(party_playlist, session.access_token);
            const party_code = await togglePlaylist(id, true, session.access_token);
            await linkPlaylist(party_code, party_sessions[0].access_token);

            // Turn party mode off
            await togglePlaylist(id, false, session.access_token);

            const returned_playlists = await getPlaylist(id, party_sessions[0].access_token);
            testEqualPlaylist(party_playlist, returned_playlists);
        });

        test('Get unlinked party playlist', async () => {
            const party_playlist = createRandomPlaylist(rand, user.id, 1);
            const { id } = await addPlaylist(party_playlist, session.access_token);
            const party_code = await togglePlaylist(id, true, session.access_token);
            await linkPlaylist(party_code, party_sessions[0].access_token);
            await unlinkPlaylist(id, party_sessions[0].access_token);

            const req = createGetReq(id, party_sessions[0].access_token);
            const res = await GET_PLAYLIST(req, { id: id.toString()});

            expect(res.ok).not.toBeTruthy();
        });
    });

    describe("Endpoint: PUT 'api/playlist/add/:id'", () => {
        afterEach(async () => {
            await clearDatabase(adminClient);
        });

        test('Add to party playlist', async () => {

        });

        test('Add to party playlist with party mode off', async () => {

        });

        test('Many add to party playlist', async () => {

        })
    });
});