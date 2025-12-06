**Version:** 2.0 (Final Release)  
**Contributors:** Vicky Liu, Lillian Nguyen, Ava Nunes
**Status:** Work in Progress (Some features under development)

(Last Updated Friday, December 5, 2025\)

# **🎧 Vynl User Manual**

*This document provides complete instructions for installing, running, and using the Vynl mobile application. It guides users through account setup, playlist creation, song discovery, and playlist export, ensuring a smooth experience from first launch to final playlist.*

​​**Vynl** is a **platform-neutral playlist builder mobile app** that lets music lovers create personalized playlists by **swiping** through candidate songs — similar to Tinder’s interface.

By choosing a few **seed songs**, Vynl recommends new tracks with similar energy, rhythm, and sound profiles. Users can **swipe right** to add a song or **swipe left** to skip. When satisfied, the playlist can be **exported** to their favorite streaming platform (starting with Spotify) via secure OAuth sign-in.

**Why Use Vynl?**

* **Smart discovery** – Find new songs by “vibe,” not just keywords or artists.  
* **Cross-platform** – Export playlists to any supported service (Spotify for MVP, more coming soon).  
* **Fast and fun** – Swipe-based UI for quick playlist building.  
* **Free and open** – No paid account required.

**Core Features (MVP):**

* Seed song selection & discovery  
* Swipe-based playlist building  
* Song previews  
* User login and saved playlists
* * Playlist export to Spotify

**Work in Progress:**

* Multi-user "party mode" concurrent playlist creation  
* Export to multiple platforms (Apple Music, YouTube Music)  
* Social features (add friends, view shared playlists)  
* Dashboard playlist stats

## **2. How to Install the Software**
### **2.1 Prerequisites**
| Requirement | Version | Purpose |
| ----- | ----- | ----- |
| **Node.js** | 24+ | Required for React Native development |
| **npm** | 9+ | Package manager |
| **Expo CLI** | 6+ | Cross-platform framework for React Native |
| **Git** | 2.40+ | Version control |
| **Supabase Account** | — | Backend database & authentication (logging in and signing up) |
| **iTunes API** | — | API access for searching songs and sound previews |
| **Last.fm** | — | API access for music data and export |
| **Expo Linear Gradient** | — | Background of the app is a gradient |
| **Expo Go** | — | For mobile testing |

### **2.2 Installation**
> npm (Node Package Manager) comes bundled with Node.js, so you only need to install Node.

```bash
# Install Node.js (version 24)
brew install node@24

# Verify installation
node -v
npm -v
```

If you see an error about linking Node, run:

```bash
brew link \--force \--overwrite node@24
```
### **2.3 Installing Dependencies**
Then ``cd`` into the inner ``/vynl`` (you should be in ``./vynl/vynl``) and run:

```bash
npm install
```

This installs dependencies for the project and the app

### **2.4 Set up Environmental Variables**

> Note: To obtain the ``.env`` file, send an email to Zack (Backend engineer) requesting access: zcrouse@uw.edu

Once you have it, insert the file in same subfolder as the ``.env.example`` located in the inner ``./vynl`` folder.

Your ``.env`` should have a structure like this:
```
EXPO_PUBLIC_SUPABASE_URL=''
EXPO_PUBLIC_SUPABASE_KEY=''
EXPO_PRIVATE_SUPABASE_KEY=''
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=''
EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=''
EXPO_PUBLIC_API_URL=''
LASTFM_API_KEY=''
EXPO_PUBLIC_YOUTUBE_CLIENT_ID=''
EXPO_PUBLIC_OWNER=''
```

## **3\. How to run the software**

Vynl uses Expo and npm for development builds

Download [Expo Go](https://apps.apple.com/us/app/expo-go/id982107779) from the App Store or Google Play.

>Note: Expo Go  supports the latest version automatically
After all prerequisites have been installed and set up, you can start the application locally using the Expo development server.

1. Navigate to the project root  
   1. Open a terminal and go to the root of your repository:  
      ```cd ../vynl/vynl``` 
2. Start the Expo development server  
   1. To run the app locally on a simulator or device: 
   
   ```bash
   npx expo start
   ```
   or if you are not on the same wifi: 
   ```bash 
   npx expo start --tunnel
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

## **4\. How to use the software**

### **Getting Started**

1. **Open the App:** Launch the Music Playlist App on your device.
2. **Sign In or Create an Account:** Save your preferences and playlists by creating a profile.
3. **There are 3 tabs on the bottom: Home, Playlists, and Profile**
4. **You are now at the Home page:** From here you can create new playlists
5. **Create New Playlist:** Choose songs you like to help the app learn your taste.


After this setup, the app will start recommending songs that match your preferences.


### **Signup & Login**

1. **Sign Up**  
   * Input your email and password  
   * Confirm your password  
   * The password must meet security requirements  
   * Once you are signed up, you will directed to the dashboard  
2. **Login**  
   * Enter your registered email and password  
   * After successful login, you are directed to the Dashboard

### **Creating a Playlist**

1. From the Dashboard, tap "Create Playlist"  
2. You will be taken to the Select Page, where you can:  
   * Select up to two music songs by searching the music song and click on the circle to select
      * To unselect a song, click on "x" by the song under the search bar or click the circle again 
   * Click 'Confirm' to start swiping

The app presents one song at a time for you to explore.
* Swipe right ❤️ if you like a song.
* Swipe left 👎 if you dislike it.
* Tap a song for more details or a short preview before deciding.

Each time you swipe right, the song is added to your new playlist.

### Modifying a Playlist ###

Your music taste changes — and your playlists can too\! The **Modify Playlist** feature allows you to **add** or **remove** songs. 

#### Accessing the Playlist: ####

1. There are 2 ways to view your playlists:  
   * After creating a playlist, click **View Playlists**  
   * Open the **Playlists** tab.  
2. Select the playlist you want to modify.

#### Removing Songs: ####

1. Find the song you want to remove.  
2. Tap the **trashcan icon** to remove songs.  
3. The song will be deleted from the playlist.

#### Adding Songs: ####

1. Tap **Add Songs** to add more songs to the playlist.  
2. Swipe left and right on the set of songs. 

Your playlist will instantly update with your new additions.

### Export Playlists

After creating a playlist, you are able to export it to Spotify\!

### Troubleshooting/FAQs

* **Getting Error: Missing EXPO_PUBLIC_SUPABASE_URL?** 
You're likely missing the environmental variables file. Email Zack (zcrouse@uw.edu) to request the ``.env`` file 
* **Songs not loading?** Check your internet connection.  
* **Can’t save playlist?** Ensure you’re signed in to your account.  
* **Recommendations off?** Update your liked songs to refine results.

## **5\. How to report a Bug**

All bugs are tracked via **GitHub Issues**:  
🔗 [Vynl Issue Tracker](https://github.com/avaamsel/vynl/issues)

### **5.1 How to Report**

1. Go to **Issues → New Issue → Bug Report Template.**  
2. Fill out:  
   * Summary  
   * Steps to reproduce  
   * Expected vs. actual result  
   * Screenshots (if possible)  
   * Device, OS, and version

🧩 Use labels:

* `type:bug`  
* `severity:low|medium|high`  
* `area:frontend|backend|UI|export`

**Workflow:**  
`New → In Progress → Ready for Review → Done`

Bug reports automatically link to pull requests using `Fixes #<issue-number>`.
