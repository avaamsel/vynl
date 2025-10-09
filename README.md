# vynl
## what is vynl?
Vynl is a platform-neutral playlist builder mobile app that lets music lovers create great playlists in minutes by swiping through candidate songs in a Tinder style interface, swiping left to reject a song and right to add a song to the playlist being built. By specifying just a few sample songs a user wants their playlist to be based on, Vynl will find new songs to recommend to users’ playlists based on similar genres, sounds, and overall “vibes” between the sample songs and the candidate songs. Once the user is finished, they can export their playlist to their third-party music streaming application of choice and start listening! 

## vynl's goals
Vynl allows users to quickly assemble vibe-consistent platform-neutral playlists without having to dig through menus, deal with weak recommendation algorithms, or their own library, which can be imported into their streaming platform of choice for listening.

### major features:
* Tinder style swiping
* Playlist exporting to various music streaming platforms
* Song "matching" and recommendation algorithm
* Saving playlists in app
* _Stretch:_ adding friends and seeing their build playlists

## repository layout


## important links:
[vynl's living document](https://docs.google.com/document/d/1faT3a1d0nOTIH54GvlgVz1ZsnCDJu_9Clpa1UxbFFoE/edit?usp=sharing)

## Running from the repo root

The actual Expo app lives in the `vynl/` folder. This repo provides convenience so you can run from the repo root:

- A small root `package.json` provides proxy scripts (e.g. `npm run start`) that forward to `vynl/`.
- A `node_modules` symlink at the repo root points to `vynl/node_modules` so Metro/Expo can find dependencies when running from the repo root.

From the repo root you can run:

```bash
npm run install
npm run start
```

Or `cd vynl` and run commands directly there if you prefer.

