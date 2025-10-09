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
```
vynl/
├── .expo/            
├── node_modules/   
├── vynl/                 
│   └── app/
│   └── assets/images/   
│   └── components/     
│   └── constants/   
│   └── hooks/  
│   └── scripts/           
└── App.js
```

## important links:
[vynl's living document](https://docs.google.com/document/d/1faT3a1d0nOTIH54GvlgVz1ZsnCDJu_9Clpa1UxbFFoE/edit?usp=sharing)

## running from the repo root

the actual expo app lives in the `vynl/` folder. this repo provides convenience so you can run from the repo root:

- a small root `package.json` provides proxy scripts (e.g. `npm run start`) that forward to `vynl/`.
- a `node_modules` symlink at the repo root points to `vynl/node_modules` so Metro/Expo can find dependencies when running from the repo root.

from the repo root you can run:

```bash
npm run install
npm run start
```

or `cd vynl` and run commands directly there if you prefer.

