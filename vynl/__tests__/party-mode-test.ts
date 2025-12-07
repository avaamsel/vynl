import { createSupabaseAdminClient } from "@/src/server/supabase";
import { clearDatabase, createRandomUser, createUser, deleteAllUsers } from "./utils/database";
import { PUT as TOGGLE_PLAYLIST } from "@/src/app/api/playlist/party/toggle/[id]+api";
import { PUT as LINK_PLAYLIST } from "@/src/app/api/playlist/party/link/[code]+api";
import { isITunesPlaylist, ITunesPlaylist } from "@/src/types";
import { Session, User } from "@supabase/supabase-js";
import { getPlaylist, addPlaylist, createToggleReq, togglePlaylist, createLinkReq } from "./utils/api";
import { makeSeededRand } from "./utils/random";
import { createRandomPlaylist } from "./utils/playlist";
import { WebBrowserPresentationStyle } from "expo-web-browser";

jest.setTimeout(10000);

describe('Playlist Test', () => {
    const adminClient = createSupabaseAdminClient();
    
    // Shared user session and user data between all test
    // Can't create a new user for each test as the auth endpoints are rate limited
    let user: User;
    let session: Session;

    // Shared list of users for testing party functionality
    let party_user: User[] = [];
    let party_session: Session[] = [];
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
            party_user.push(user_data.user);
            party_session.push(user_data.session);
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
            const req = createLinkReq(party_code, party_session[0].access_token);
            const res = await LINK_PLAYLIST(req, { code: party_code });

            if (!res.ok) {
                console.log(await res.text());
            }
            expect(res.ok).toBeTruthy();

            const { data, error } = await adminClient
                .from('party_users')
                .select()
                .eq('playlist_id', id)
                .eq('user_id', party_user[0].id)
                .single();
            
            console.log(error);
            expect(error).toBeNull();
        });
    });

    describe("Endpoint: PUT 'api/playlist/party/unlink/:code", () => {

    });

    describe("Endpoint: PUT 'api/playlist/party/link/:code", () => {

    });
});