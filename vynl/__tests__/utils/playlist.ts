/*
    This file is a collection of utility functions for working with playlist objects
    in a testing context. 
*/

import { ITunesPlaylist, ITunesSong } from "@/src/types";
import { getRandomInt, getRandomString } from "./random";

// Generates a playlist with random values with a given number of songs. Uses the provided
// random number generator. "id" will alway be set to zero and create_at will be an empty
// string since these values are defined upon calling the API. user_id will be set to the
// given user_id value.
export function createRandomPlaylist(rand: () => number, user_id: string, songs_length: number): ITunesPlaylist {
    const songList: ITunesSong[] = [];
    for (let i = 0; i < songs_length; i++) {
        songList.push(createRandomSong(rand, i));
    }

    return {
        id: 0,
        name: getRandomString(rand, getRandomInt(rand, 10, 50)),
        created_at: "",
        user_id: user_id,
        songs: songList
    }
}

export function createRandomSong(rand: () => number, song_id: number): ITunesSong {
    return {
        song_id: song_id, // Can't be random because we need to ensure the ids are unique
        title: getRandomString(rand, getRandomInt(rand, 10, 50)),
        artist: getRandomString(rand, getRandomInt(rand, 10, 50)),
        preview_url: getRandomString(rand, getRandomInt(rand, 10, 50)),
        cover_url: getRandomString(rand, getRandomInt(rand, 10, 50)),
        duration_sec: getRandomInt(rand, 10, 300)
    }
}