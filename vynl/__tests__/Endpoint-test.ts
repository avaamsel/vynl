import { createSupabaseAdminClient } from "@/src/server/supabase";
import { clearDatabase, createUser } from "./utils/database";
import { clear } from "console";
import { POST, POST as POST_PLAYLIST } from "@/src/app/api/playlist/+api";
import { isITunesPlaylist } from "@/src/types";

const adminClient = createSupabaseAdminClient();

describe('Testing loading correct env', () => {

    test('Supabase URL', () => {
        expect(process.env.EXPO_PUBLIC_SUPABASE_URL).toBe('https://xgmicqytifznusiwsaor.supabase.co');
    })
});

// describe('Connected to Supabase', () => {

// })

describe("Testing endpoint: POST 'api/playlist'", () => {
    beforeEach(() => {
        clearDatabase(adminClient);
    });

    afterAll(() => {
        clearDatabase(adminClient);
    });

    test('Create user', async () => {
        const user = await createUser('test@test.com', '123456');
        expect(user).not.toBeNull();
        expect(user).toBeDefined();

        const { data, error } = await adminClient.auth.admin.getUserById(user!.user!.id);
        expect(error).toBeNull();

        expect(data.user?.email).toBe(user!.user!.email);
        expect(data.user?.id).toBe(user!.user!.id);
    });

    test("create empty", async () => {
        const user_data = await createUser('test@test.com', '123456');
        expect(user_data).not.toBeNull();
        expect(user_data).toBeDefined();

        const empty_playlist = {
            "id": 0, 
            "name": "An empty playlist", 
            "created_at": "", 
            "user_id": "", 
            "songs": [
            ]
        }

        const req = new Request("localhost:1234/api/playlist", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user_data!.session!.access_token}`,
            },
            body: JSON.stringify(empty_playlist)
        });

        expect(req).not.toBeNull();

        const res = await POST_PLAYLIST(req);

        expect(isITunesPlaylist(res.json())).toBeTruthy();

    })
})