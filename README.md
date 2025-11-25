# vynl
## what is vynl?
Vynl is a platform-neutral playlist builder mobile app that lets music lovers create great playlists in minutes by swiping through candidate songs in a Tinder style interface, swiping left to reject a song and right to add a song to the playlist being built. By specifying just a few sample songs a user wants their playlist to be based on, Vynl will find new songs to recommend to users’ playlists based on similar genres, sounds, and overall “vibes” between the sample songs and the candidate songs. Once the user is finished, they can export their playlist to their third-party music streaming application of choice and start listening! 

## vynl's goals
Vynl allows users to quickly assemble vibe-consistent platform-neutral playlists without having to dig through menus, deal with weak recommendation algorithms, or their own library, which can be imported into their streaming platform of choice for listening.

### major features:
* Tinder style swiping
* Playlist exporting to various music streaming platforms (work in progress)
* Song "matching" and recommendation algorithm
* Saving playlists in app
* _Stretch:_ adding friends and seeing their build playlists

### current vynl status (updated for 11/04 demo release) :
At the time of our demo release, Vynl is has a functional log in, where a user can log in or sign up and see any previously saved playlists they may have created. Vynl also has the "select songs" ability implemented where the user selects two songs that they want the playlist they're creating to be inspired by, as well as the animated left and right swiping features completed. When a user has gone through the 10 songs presented to them they can view their created playlist.

## repository layout
```
vynl/                  # Project root
├── .expo/             # Expo-managed metadata and caches(do not edit manually)
├── node_modules/      # Installed dependencies managed by npm
├── vynl/              # Primary application source    
│   └── app/           # Screens adn routing using Expo router
│   └── assets/
│       └──images/     # Application images and icons
|       └──fonts/      # Application fonts
│   └── components/    # Resuable UI components
│   └── constants/     # Shared constants such as colors, spacing, route names
│   └── hooks/         # Custom React hooks and client-side logic
│   └── scripts/       # Local automation scripts and developer utilities
└── App.js             # Root entry that forwards to the app under ./vynl
```

## important links:
[vynl's living document](https://docs.google.com/document/d/1faT3a1d0nOTIH54GvlgVz1ZsnCDJu_9Clpa1UxbFFoE/edit?usp=sharing)

## how to build the system
Vynl uses Expo and npm for development builds

* Node.js 18 or newer  
* npm bundled with Node  
* Expo CLI is installed globally

```bash 
npm install
```

This installs dependencies for the project and the app under `./vynl`.

Then change your directory to the _./vynl_ folder to properly run and start the environment, 
```bash
cd vynl
```

Finally, start the development server from the repository root

```bash 
npx expo start --tunnel
```

## how to test the system

1. Make sure you have the required dev dependencies for Jest:  
   1. If not, run: ``npx expo install jest-expo jest @types/jest \--dev``
   2. Also make sure to run: ``npx expo install @testing-library/react-native \--dev`` 
2. Run ``npx run test`` to see the test results within the terminal – make sure this is done within the Vynl directory and not the root\!

To see code coverage reports, run ``npx run test`` within the code’s root directory and a table displaying coverage percentages should appear in the terminal that can be filtered by failed tests, etc 

For more examples for testing, especially regarding APIs, check out: [https://callstack.github.io/react-native-testing-library/docs/api/queries](https://callstack.github.io/react-native-testing-library/docs/api/queries) 

## how to run the system
Download ``Expo Go`` from the App Store or Google Play.


>Note: Expo Go  supports the latest version automatically
After all prerequisites have been installed and set up, you can start the application locally using the Expo development server.

1. Navigate to the project root  
   1. Open a terminal and go to the root of your repository:  
      ```cd path/to/your/project``` 
2. Start the Expo development server  
   1. To run the app locally on a simulator or device: 
   
   ```bash
   npx expo start –tunnel
   ```

   >Note: This avoids the problem of needing both the phone and computer to use the same wifi

3. This will launch the Expo Dev Tools in your browser. From there, you can:  
   1. Press **"i"** to open the app in iOS simulator (Mac only)  
   2. Press **"a"** to open the app in Android emulator  
   3. Or scan the QR code using the ``Expo Go app`` on your physical mobile device

Tip: Run with \--clear to reset cache if you encounter issues:

```bash
npx expo start \--clear
```

### _happy swiping!_
