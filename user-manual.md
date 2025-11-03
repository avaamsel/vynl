**Version:** 1.0 (Beta Release)  
**Contributors:** Vicky, Lillian  
**Status:** Work in Progress (Some features under development)

(Last Updated October 28, 2025\)

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

**Work in Progress:**

* Playlist export to Spotify  
* Export to multiple platforms (Apple Music, YouTube Music)  
* Social features (add friends, view shared playlists)  
* Dashboard playlist stats

## **2\. How to install the software**

### **2.1 Prerequisites:**

| Requirement | Version | Purpose |
| ----- | ----- | ----- |
| **Node.js** | 18+ | Required for React Native development |
| **npm** | 9+ | Package manager |
| **Expo CLI** | 6+ | Cross-platform framework for React Native |
| **Git** | 2.40+ | Version control |
| **Supabase Account** | — | Backend database & authentication (logging in and signing up) |
| **iTunes API** | — | API access for searching songs and sound previews |
| **Last.fm** | — | API access for music data and export |
| **Expo Linear Gradient** | — | Background of the app is a gradient |
| **Expo Go** | — | For mobile testing |

### **2.2 Installation Steps:**

Follow the steps below to install and configure all the tools required to run **Vynl** locally.

---

### **Step 1 – Install Node.js and npm**

> npm (Node Package Manager) comes bundled with Node.js, so you only need to install Node.

```bash
# Install Node.js (version 18)
brew install node@18

# Verify installation
node -v
npm -v
```

If you see an error about linking Node, run:

```bash
brew link \--force \--overwrite node@18
```
### **Step 2 - Install Expo CLI**

Expo is the framework used to run and test Vynl on Android and iOS

```bash
# install expo 
npm install \-g expo-cli
# verify installation
expo \--version
```

### **Step 3 - Set Up Git**
Git is used for version control and cloning the repository.

```bash
# setup git 
brew install git
# verify Installation Version
git \--version

```
### **Step 4 - Create a Supabase Account**

Supabase provides authentication and database services for Vynl.

1. Go to https://supabase.com  
2. Create a free account and log in.  
3. Click "New Project"  
4. Choose a name, password, and database region.  
5. Once it's created, go to Project Settings → API  
6. Copy the following values:  
   * Project URL  
   * anon public key
7. In your project root folder, create a ``.env`` file in your project root (if not already created), and add:

```bash 
EXPO\_PUBLIC\_SUPABASE\_KEY="your_supabase_url"
EXPO\_PUBLIC\_SUPABASE\_URL="your_supabase_anon_key"
EXPO\_PRIVATE\_SUPABASE\_KEY="your_supabase_service_role_key"
```

>Note: Never commit .env files to GitHub — they are in .gitignore for this reason.

### **Step 5 - Configure Music Data APIs**

* If using public iTunes Search API: **no setup required**
* If using **MusicKit**:

  * Sign into your Apple Developer Account

  * Create an **App Identifier** and generate a **developer token**

  * Add to your `.env` file:

``` bash 
DEVELOPER_TOKEN="your_musickit_developer_token"
MUSIC_USER_TOKEN="your_music_user_token"
```

* If using Last.fm:

   * Go to: https://www.last.fm/api/account/create 
   * Create an API account.

> Note your API Key and Secret.

Add to your .env file:
``` bash 
LASTFM\_API\_KEY="your\_lastfm\_api\_key"
LASTFM\_API\_SECRET="your\_lastfm\_api\_secret"
```

### **Step 6 - Load Environment Variables**

Once ``.env`` is set up, restart your dev server:

```bash 
npx expo start \--clear
```
### **Step 7 - Install Required Expo Dependencies**

Vynl uses expo-linear-gradient for visual styling and gradients.
```bash
npm install expo-linear-gradient
```

## **3\. How to run the software**

Vynl uses Expo and npm for development builds

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

## **4\. How to use the software**

### **Navigation Overview**

Once you're logged in, the app provides a tab-based navigation system:

* **Welcome page** – Entry point of the app. (work in progress)  
* **Sign up/log in** – You will be directed here after the welcome page   
* **Home (Dashboard)** – You will be directed here after logging in. You can create and view playlists.  
* **Upload Songs** – Upload 5-10 seed songs to generate the song recommendations to swipe   
* **Swipe** – Swipe through song recommendations to create a new playlist

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

*Note: File upload functionality is currently UI-only. Backend upload storage & validation is Work in Progress.*

1. From the Dashboard, tap "Create Playlist"  
2. You will be taken to the Upload Page, where you can:  
   * Upload music files  
   * Submit to create a new playlist

##  

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

