  
**Version:** 2.0 (Final Release)  
**Contributors:** Vicky Liu, Louis Bernard, Aliyah Mcreae, Ava Nunes

(Last Updated Sunday, December 7, 2025)

# 🎧 Vynl Developer Guide:
This document provides full instructions for setting up the development environment, understanding repository organization, building the software, and contributing safely and effectively.

## 1\. 🛠️ Obtaining the source code:

1.1 Clone the repository

Vynl is maintained in a single Git repository. No submodules are required.

```bash
# SSH 
git clone git@github.com:avaamsel/vynl.git

# or HTTPS
git clone https://github.com/avaamsel/vynl.git
cd vynl
```

## 2\. 📂 Directory Layout

The repository is organized as follows. Paths are relative to the repository root.

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

**Key Directories:**
* Core application code: `vynl/`
* Tests: `vynl/__tests__`
* Screens and navigation: `vynl/src/app/`
* UI components: `vynl/src/components/`
* Reusable logic: `vynl/src/hooks/`
* Backend configuration: `vynl/src/server/` and `vynl/src/types/`

## 3\. 🚀Building the Software

Vynl uses Expo and npm for development builds
### 3.1 Prerequisites

| Requirement | Version | Purpose |
| ----- | ----- | ----- |
| **Node.js** | 24+ | Required for React Native development |
| **npm** | 9+ | Package manager (bundled with Node.js) |
| **Expo CLI** | 6+ | Cross-platform framework for React Native |
| **Git** | 2.40+ | Version control |
| **Jest** | — | For mobile testing |
| **Supabase Account** | — | Backend database & authentication (logging in and signing up) |
| **iTunes API** | — | API access for searching songs and sound previews |
| **Last.fm** | — | API access for music data and export |
| **Expo Linear Gradient** | — | Background of the app is a gradient |
| **Expo Go** | — | For mobile testing |

**Installation on Mac:**
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

**Installation on Windows:**
1. Visit [https://nodejs.org/](https://nodejs.org/)
2. Download the Windows Installer (.msi) for Node.js version 24 or newer
3. Run the installer and check "Add to PATH" during installation and accept default installation options
4. Restart your terminal and verify: `node -v` and `npm -v`
5. Verify installation:
   ```bash
   node -v
   npm -v
   ```

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

**Installing Expo CLI:**

After Node.js is installed, install Expo CLI globally:

```bash
npm install -g expo-cli
```

### 3.2 Install Dependencies

Then ``cd`` into the inner ``/vynl`` (you should be in ``./vynl/vynl``) and run:

```bash
cd vynl
npm install
```

### 3.3 Set up Environmental Variables

To obtain the `.env` file, send an email to Zack (Backend engineer) requesting access: zcrouse@uw.edu

Once you have it, place the file in the same subfolder as the `.env.example` located in the inner `./vynl` folder.

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

### **3.4 Development build and run**

Navigate to the vynl folder:
```bash
cd vynl
```

Run the development server:
```bash
npx expo start
```

**Platform-Specific Testing:**
* **Mobile (iOS/Android):** Use the ``Expo Go`` app on your physical device or emulator
* **Web:** Web preview is currently **not supported** due to localStorage compatibility issues. **_Testing should be done on mobile platform only._**

If you encounter connection problems or can't be on the same Wi-Fi network:
```bash
npx expo start --tunnel
```

> **Note:** If tunnel mode fails on macOS due to permissions, use LAN mode instead or install `@expo/ngrok` locally: `npm install @expo/ngrok --save-dev`

## 4. How to Test the Software

### 4.1 Installing Jest

Make sure you have the required dev dependencies for Jest. To check Jest's dev dependencies run:
```bash
npm list jest-expo jest @types/jest @testing-library/react-native
```

If your dependencies are not:
```
jest: ^29.7.0
jest-expo: ^54.0.13
@types/jest: ^29.5.14
@testing-library/react-native: ^13.3.3
@testing-library/jest-native: ^5.4.3
```

Install them:
```bash
npx expo install jest-expo jest @types/jest --dev
npx expo install @testing-library/react-native --dev
```

Also make sure to run: ``npx expo install @testing-library/react-native \--dev`` 

### 4.2 Running Tests:
  Run ``npx run test`` to see the test results within the terminal – make sure this is done within the Vynl directory and not the root\!

To see code coverage reports, run ``npx run test`` within the code’s root directory and a table displaying coverage percentages should appear in the terminal that can be filtered by failed tests, etc.

For more examples, especially regarding APIs, check out: [https://callstack.github.io/react-native-testing-library/docs/api/queries](https://callstack.github.io/react-native-testing-library/docs/api/queries)

## 5\. ✍️ How to Add New Tests:

1. Make sure you have the required dev dependencies for Jest (see Section 4.1)

2. Test files should be placed in the `__tests__` folder. Test file naming convention: `FileBeingTested-test.tsx`

3. Within testing files, include:
   ```typescript
   import { render } from '@testing-library/react-native';
   import ComponentName from '@/path/to/component';
   ```

4. `__tests__` files can be added to test directories other than just the root, e.g., within `utils`

## 6. How to Build a Release of the Software

### Prerequisites

1. Make sure Expo CLI is installed: `npm install -g expo-cli`
2. Log into Expo: `npx expo login`

### Configuration

Ensure `app.json` has this structure:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "..."
    },
    "android": {
      "package": "..."
    }
  }
}
```

The `bundleIdentifier` and `package` should be unique and match the App Store / Play Store.

### Building Releases
Then, build the releases with the following commands : 
**Android:**
```bash
npx eas build \--platform android
```

**iOS:**
```bash
npx eas build --platform ios
```

If this is your first time, you'll be prompted to set up credentials (Expo can manage them for you).

### Installing or Publishing

**Install APK:**
```bash
adb install <file>.apk
```

**Publish:** Upload the generated `.aab` (Android) or `.ipa` (iOS) to the respective app stores.

### Optional: Build Locally

You can build locally (requires Android Studio or Xcode):
```bash
cd vynl
npm run lint
npm test
```

## **7. 📋 Available Scripts:**
From the vynl/ directory:
* ``npx start`` - Start the Expo development server
* ``npx test`` - Run the test suite
* ``npx test -- --coverage`` - Run tests with coverage report
* ``npx expo start`` - Alternative command to start development server
* ``npx eas build --platform [android|ios]`` - Build release for specified platform

## **8. 🔄 Continuous Integration (CI/CD)**

Vynl uses GitHub Actions for continuous integration. The CI workflow (defined in `.github/workflows/expo_test.yml`) runs automatically on all pull requests and pushes to 
`main` and `develop` branches.

**CI Checks:**
* Code linting (`npm run lint`)
* Test suite execution (`npm test`)

All CI checks must pass before a pull request can be merged. Run these checks locally before submitting:

**Note:** If CI checks fail, review the error messages in the GitHub Actions tab of your pull request. The CI will automatically re-run when you push new changes.

## **9. 🤝 Contributing**
**When contributing to Vynl:**
1. Ensure your Node.js version is 24 or newer
2. Write tests for new features (see Section 5)
3. Run the test suite and linter before submitting changes (see Section 8.4)
4. Ensure all CI checks pass on your pull request (see Section 8)
5. Test on both iOS and Android platforms where applicable
6. Follow the existing code organization structure outlined in Section 2


For questions or issues, please refer to the project's issue tracker or contact the development team!

