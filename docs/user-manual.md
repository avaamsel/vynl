**Version:** 2.0 (Final Release)  
**Contributors:** Vicky Liu, Lillian Nguyen, Ava Nunes, Aliyah Mcrae

(Last Updated Sunday, December 7, 2025)

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
* Playlist export to Spotify and YouTube Music
* Multi-user "party mode" concurrent playlist creation      

**Work in Progress:**

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

**Install Node.js:**

**On Mac:**
```bash
brew install node@24
node -v  # Verify installation
npm -v
```

**On Windows:**
1. Visit [https://nodejs.org/](https://nodejs.org/)
2. Download the Windows Installer (.msi) for Node.js version 24 or newer (LTS version recommended)
3. Run the installer and check "Add to PATH" during installation, accept the defaul installation options
4. Restart your terminal and verify: `node -v` and `npm -v`

**Installing Git on Windows:**
1. Visit [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Download the Git for Windows installer
3. Run the installer and follow the setup wizard
   - Use default options (recommended for most users)
   - Make sure "Git from the command line and also from 3rd-party software" is selected
4. Restart your terminal after installation
5. Verify installation:
   ```bash
   git --version
   ```

**Install Expo CLI:**
```bash
npm install -g expo-cli
npx expo --version  # Verify installation
```

### 2.3 Set up Environmental Variables

To obtain the `.env` file, send an email to Zack (Backend engineer) requesting access: zcrouse@uw.edu

Once you have it, place the file in the same subfolder as the `.env.example` located in the inner `./vynl` folder.

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
EXPO_PUBLIC_LASTFM_API_KEY=''
EXPO_PUBLIC_YOUTUBE_CLIENT_ID=''
EXPO_PUBLIC_OWNER=''
```

## 3. How to Run the Software

1. **Download Expo Go** from the App Store or Google Play Store

Download [Expo Go](https://apps.apple.com/us/app/expo-go/id982107779) from the App Store or Google Play.

>Note: Expo Go  supports the latest version automatically
After all prerequisites have been installed and set up, you can start the application locally using the Expo development server.

2. Navigate to the project root  
   1. Open a terminal and go to the root of your repository:  
      ```cd ../vynl/vynl``` 
3. Start the Expo development server  
   - To run the app locally on a simulator or device: 
   
   ```bash
   npx expo start
   ```
   or if you are not on the same wifi: 
   ```bash 
   npx expo start --tunnel
   ```
4. **Launch the app:**
   * Press **"i"** to open in iOS simulator (Mac only)
   * Press **"a"** to open in Android emulator
   * Scan the QR code using the Expo Go app on your physical device

## 4. How to Use the Software

### **Getting Started**

1. **Open the App:** Launch the Music Playlist App on your device.
2. **Sign In or Create an Account:** Save your preferences and playlists by creating a profile.
3. **There are 4 tabs on the bottom: Home, Playlists, Party, and Profile**
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
After creating a playlist, you are able to export it to Spotify or YouTube Music\! 

#### Exporting to Spotify
Once you have selected a playlist to view, to export your playlist to Spotify, click the green "Export to Spotify" button.
- A modal will pop up telling you to connect your Spotify account, you will be directed to a Spotify login page where you can enter your Spotify account's username and password
- When your account has been connected, you are now able to export your playlist by clicking the "Export to Spotify" button
   - If the button is clicked, you will see a loading bar progress as your songs are being exported

      > _Vynl is currently in "developer mode", so to log into your Spotify account through Vynl, the email associated with your Spotify account needs to be manually added to our Spotify Developer Dashboard. If you would like to use Vynl and already do not have a verified email with us, please reach out to avanunes@uw.edu to get added!_

- Once your playlist has been successfully exported to Spotify, a popup will allow you to view your newly exported playlist in Spotify
   - If you choose to open your playlist in Spotify, you will be redirected either to a new tab in your browser app or to the Spotify app itself if it has already been downloaded on your device which will be open to your new playlist

#### Exporting to YouTube Music
Once you have selected a playlist to view, to export your playlist to YouTube Music, click the red "Export to YouTube Music" button.
- A modal will pop up telling you to connect your YouTube Music account, you will be directed to a Google login page where you can log in to the Google account associated to the YouTube account/channel you wish to export to, this should likely be a @uw.edu email
  - You may get a screen within the Google login page that says "Google hasn't verified this app", click "continue". After doing this, you will be asked to give Vynl certain accesses to your Google account, please select all and then click "continue".

      > _Vynl is currently not deployed within Google's Cloud Console because Google has a lot of requirements to deploy that we have chosen not to do for the sake of 403's project timeline. Therefore, in order to export your playlists to your YouTube account, your email associated with it will need to be manually added to a verified list of "testers" within Vynl's Cloud Console account. If you would like to use Vynl and already do not have a verified email with us, please reach out to avanunes@uw.edu to get added!_
   
- When your account has been connected, you are now able to export your playlist by clicking the "Export to YouTube Music" button, you will then see a loading bar progress as your songs are being exported
- Once your playlist has been successfully exported to YouTube Music, a popup will allow you to view your newly exported playlist in YouTube Music
   - If you choose to open your playlist in YouTube Music, you will be redirected either to a new tab in your browser app or to the YouTube Music app itself if it has already been downloaded on your device which will be open to your new playlist
- If you already have a playlist in your YouTube Music account with the same name as the one being exported, you will be given three options as to what you can do with these playlists:
   1. You can add the songs from the playlist that you are currently exporting to the existing playlist on your account
   2. You can replace the existing playlist on your account with the playlist you are currently exporting
   3. You can export the new playlist and keep the existing one the same. Your new playlist's name will have (#) appended to it.

#### Disconnecting Spotify and YouTube Music Accounts
If you have previously exported a playlist to Spotify or YouTube Music within the Vynl app, your credentials will have been saved so you don't have to log in again. However, if you would like to disconnect your Spotofy or YouTube Music account:
- Click on the "Export to Spotify/YouTube Music" button when viewing a playlist
- You should now see the "Ready to Export" screen, click "Disconnect Spotify/YouTube" link below the button to actually export your playlist to disconnect your saved log in credentials
   - Once you have disconnected your Spotify or YouTube Music account, you should now be able to connect your Spotify/Google account once again when you would like or even connect a different one!

### Profile Page 👤
The Profile page is your personal hub where you can view your account information and track your playlist activity.

#### Accessing the Profile Page
- Tap the **Profile** tab at the bottom right of the screen

#### Profile Overview
- At the top of the page, you'll see your profile icon displayed in the vynl logo
- Below that are two statistics cards showing:
  - **Playlists Created**: Total number of playlists you've made
  - **Party Playlists**: Number of collaborative playlists you've participated in
- Both statistics display as numbers (e.g., "0" when you first start)

#### Account Information Section
The profile displays your key account details in a clean, organized format:
- **Email**: Your registered email address (e.g., "user@example.com")
- **Member Since**: The date you joined Vynl (e.g., "Jan 2024")
- This information is displayed in a light card with clear labels

#### Logging Out
- To sign out of your account, tap the **Log Out** button at the bottom of the profile page
- The button has a distinctive pink/coral gradient color that makes it easy to find
- You'll be returned to the login screen after logging out
- This is useful when you need to switch accounts or sign out for security

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

1. Go to **Issues → New Issue → Bug Report Template**
2. Fill out:
   * Summary
   * Steps to reproduce
   * Expected vs. actual result
   * Screenshots (if possible)
   * Device, OS, and version

**Use labels:**
* `type:bug`
* `severity:low|medium|high`
* `area:frontend|backend|UI|export`

## 6. Known Bugs

Known bugs and limitations are documented in the [GitHub Issue Tracker](https://github.com/avaamsel/vynl/issues). Please check existing issues before reporting a new bug.

**Current Limitations:**
* Spotify and YouTube Music exports require manual email verification (contact avanunes@uw.edu)
* Web preview is not supported (mobile platform only)
* Some features are work in progress (social features, dashboard stats)
