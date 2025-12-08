/*
    This file stores utility functions to interact with our API directly. These functions
    are meant to be used inside of test as they include expect statements that check for
    values returned from the endpoints. Additionally there are functions to help build
    request used in interacting with the databse
*/

import { isITunesPlaylist, ITunesPlaylist, ITunesSong } from "@/src/types";
import { POST as POST_PLAYLIST, GET as GET_PLAYLISTS } from "@/src/app/api/playlist/+api";
import { GET as GET_PLAYLIST, PUT as PUT_PLAYLIST} from "@/src/app/api/playlist/[id]+api";
import { PUT as ADD_TO_PLAYLIST } from "@/src/app/api/playlist/add/[id]+api";
import { PUT as LINK_PLAYLIST } from "@/src/app/api/playlist/party/link/[code]+api";
import { PUT as TOGGLE_PLAYLIST } from "@/src/app/api/playlist/party/toggle/[id]+api";
import { PUT as UNLINK_PLAYLIST } from "@/src/app/api/playlist/party/unlink/[id]+api";

/*
----------------------- API Wrappers -----------------------
*/

export async function getPlaylists(access_token: string, party: boolean = false, uid?: string): Promise<ITunesPlaylist[]> {
    const req = createGetAllReq(access_token, party, uid);
    const res = await GET_PLAYLISTS(req);
    
    expect(res.ok).toBeTruthy();
    return res.json();
}

// Helper function to call the post playlist endpoint with playlist.
export async function addPlaylist(playlist: ITunesPlaylist, access_token: string): Promise<ITunesPlaylist> {
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

// Helper function to call the get playlist by id enpoint with a given id.
export async function getPlaylist(id: number, access_token: string): Promise<ITunesPlaylist> {
    const req = new Request("localhost:1234/api/playlist/" + id, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
        }
    });
    expect(req).not.toBeNull();

    const res = await GET_PLAYLIST(req, { id:id.toString() });
    const body = await res.json();
    expect(isITunesPlaylist(body)).toBeTruthy();
    return body;
}

export async function togglePlaylist(id: number, enable: boolean, access_token: string): Promise<string> {
    const req = createToggleReq(id, enable, access_token);
    const res = await TOGGLE_PLAYLIST(req, { id:id.toString() });

    expect(res.ok).toBeTruthy();
    const body = await res.text();
    if (enable) {
        expect(body).not.toBeNull();
    } else {
        expect(body).toBe("OK");
    }
    return body;
}

export async function linkPlaylist(code: string, access_token: string): Promise<string> {
    const req = createLinkReq(code, access_token);
    const res = await LINK_PLAYLIST(req, { code:code });

    if (!res.ok) {
        console.log(await res.text());
    }
    expect(res.ok).toBeTruthy();
    // Should return id of playlist
    return await res.text();
}

export async function unlinkPlaylist(id: number, access_token: string) {
    const req = createUnlinkReq(id, access_token);
    const res = await UNLINK_PLAYLIST(req, { id: id.toString() });

    if (!res.ok) {
        console.log(await res.text());
    }
    expect(res.ok).toBeTruthy();
}

/*
----------------------- Request Creation -----------------------
*/

export function createGetAllReq(access_token: string, party: boolean = false, uid?: string) {
    const start = (party || uid) ? "?" : "";
    const party_param = (party) ? "party=true" : "";
    const uid_param = (uid) ? 'uid=' + uid : "";
    const conj = (party && uid) ? "&" : "";
    const req = new Request("localhost:1234/api/" + start + party_param + conj + uid_param, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
        }
    });
    return req;
}

// Creates a request for the add song endpoint with the given values.
export function createAddReq(id: number, songs: ITunesSong[], access_token: string): Request {
    const req = new Request("localhost:1234/api/playlist/add/" + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({songs: songs})
    });
    return req;
}

// Creates a request for the toggle party mode endpoint with given values.
export function createToggleReq(id: number, enable: boolean, access_token: string): Request {
    const req = new Request("localhost:1234/api/playlist/party/toggle/" + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({enable: enable})
    });
    return req;
}

export function createLinkReq(code: string, access_token: string): Request {
    const req = new Request("localhost:1234/api/playlist/party/link/" + code, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
        }
    });
    return req;
}

export function createUnlinkReq(id: number, access_token: string): Request {
    const req = new Request("localhost:1234/api/playlist/party/unlink/" + id.toString, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
        }
    });
    return req;
}

export function createGetReq(id: number, access_token: string): Request {
    return new Request("localhost:1234/api/playlist/" + id, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
        }
    });
}