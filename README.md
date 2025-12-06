# vynl
## what is vynl?
Vynl is a platform-neutral playlist builder mobile app that lets music lovers create great playlists in minutes by swiping through candidate songs in a Tinder style interface, swiping left to reject a song and right to add a song to the playlist being built. By specifying just a few sample songs a user wants their playlist to be based on, Vynl will find new songs to recommend to users’ playlists based on similar genres, sounds, and overall “vibes” between the sample songs and the candidate songs. Once the user is finished, they can export their playlist to their third-party music streaming application of choice and start listening! 

## vynl's goals
Vynl allows users to quickly assemble vibe-consistent platform-neutral playlists without having to dig through menus, deal with weak recommendation algorithms, or their own library, which can be imported into their streaming platform of choice for listening.

### major features:
* Tinder style swiping
* Playlist exporting to Spotify and YouTube Music
* Song "matching" and recommendation algorithm
* Saving playlists in app
* Concurrent, multi-user "party mode" playlist creation
* _Stretch:_ adding friends and seeing their build playlists

## repository layout
```
vynl/                                  # Project root
├── .expo/                             # Expo-managed metadata and caches (do not edit manually)
├── .github/                           # GitHub-specific configurations
│   └── workflows/                     # Vynl's CI/CD workflows
│
├── docs/                              # Documentation files
├── node_modules/                      # Installed dependencies managed by npm
├── vynl/                              # Primary application source    
│   ├── __tests__/                     # Unit and integration tests, organized by feature
│   │   └── utils/                     # Shared test utilities
│   │
│   ├── assets/
│   │   ├── images/                    # Application images and icons
│   │   └── fonts/                     # Application fonts
│   │
│   ├── scripts/                       # Local automation scripts and developer utilities
│   ├── src/               
│   │   ├── app/                       # Screens and routing using Expo router
│   │   │   └──  (tabs)/               # Tab-based navigation screens
│   │   │ 
│   │   ├── components/    
│   │   │   └── ui/                    # Reusable UI components
│   │   │ 
│   │   ├── constants/                 # Shared constants such as colors, spacing, route names
│   │   ├── hooks/                     # Custom React hooks and client-side logic
│   │   ├── server/                    # Backend related utilities
│   │   │   └── song-recommendation/   # Song recommendation logic
│   │   │ 
│   │   ├── services                   
│   │   │   └── music-providers/       # External integration of music providers
│   │   │ 
│   │   ├── types/                    
│   │   │   └── database/              # Database type definitions and interfaces
│   │   │
│   │   └── utils/                     # Helper funtions and utilities 
│   │
│   └── supabase/                      # Supabase configuration and backend setup
│
└── App.js                             # Root entry that forwards to the app under ./vynl
```

## important links:
* **[vynl's living document:](https://docs.google.com/document/d/1faT3a1d0nOTIH54GvlgVz1ZsnCDJu_9Clpa1UxbFFoE/edit?usp=sharing)** contains information on vynl's ideation, development timeline, technical description, and functional and non-functional requirements 
* **[vynl's developer guide:](/docs/developer-guide.md)** instructions on setting up vynl's development environment, understanding the repository layout, and building the software
* **[vynl's user guide:](/docs/coding-guidelines.md)** instruction on installing, running, and using the vynl mobile application
* **[vynl's api endpoints:](/docs/api_endpoints.md)** describes the APIs that are utilized in Vynl

### _happy swiping!_
