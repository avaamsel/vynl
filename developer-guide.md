  
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
vynl/                  # Project root
├── .expo/             # Expo-managed metadata and caches(do not edit manually)
├── node_modules/      # Installed dependencies managed by npm
├── vynl/              # Primary application source    
│   └── app/           # Screens adn routing using Expo router
│   └── assets/
│       └──images/     # Application images and icons
│   └── components/    # Resuable UI components
│   └── constants/     # Shared constants such as colors, spacing, route names
│   └── hooks/         # Custom React hooks and client-side logic
│   └── scripts/       # Local automation scripts and developer utilities
└── App.js             # Root entry that forwards to the app under ./vynl
```

2.1 Source Files

* Core application code resides in `vynl/`  
* Screens and navigation reside in `vynl/app/`  
* Shared UI components reside in `vynl/components/`  
* Reusable logic resides in `vynl/hooks/`  
* Global configuration values reside in `vynl/constants/`


## 3\. 🚀Building the Software

Vynl uses Expo and npm for development builds

### **3.1 Prerequisites**

* Node.js 18 or newer  
* npm bundled with Node  
* Expo CLI is installed globally

**3.2  Install dependencies**

```bash 
npm install
```

This installs dependencies for the project and the app under `./vynl`.

**3.3 Development build and run**

Start the development server from the repository root

```bash 
npx expo start
```

## 4\. 🧑‍💻 How to test the software:

1. Make sure you have the required dev dependencies for Jest:  
   1. If not, run: ``npx expo install jest-expo jest @types/jest \--dev``
   2. Also make sure to run: ``npx expo install @testing-library/react-native \--dev`` 
2. Run ``npx run test`` to see the test results within the terminal – make sure this is done within the Vynl directory and not the root\!

To see code coverage reports, run ``npx run test`` within the code’s root directory and a table displaying coverage percentages should appear in the terminal that can be filtered by failed tests, etc 

For more examples for testing, especially regarding APIs, check out: [https://callstack.github.io/react-native-testing-library/docs/api/queries](https://callstack.github.io/react-native-testing-library/docs/api/queries) 

## 5\. ✍️ How to add new tests:

1. Make sure you have the required dev dependencies for Jest:  
   1. If not, run: ``npx expo install jest-expo jest @types/jest \--dev``  
   2. Also make sure to run: ``npx expo install @testing-library/react-native \--dev``  
2. Most of the unit tests created will fall under the “\_\_tests\_\_” folder in the project root directory, within that folder names for tests will follow this naming convention: ``FileBeingTested-test.tsx``  
   1. Within testing files, include: ``import { render } from '@testing-library/react-native';`` as well as the import for the file being imported: ``import HomeScreen from '@/app/index';``  
3. \_\_tests\_\_ files can be added to test directories other than just the root, ex. within ``utils``

**6\. 🚧 How to build a release of the software:**

First, make sure Expo cli is installed (npm install \-g expo-cli), and log into expo with this command : 

```bash 
npx expo login
```

After, make sure the app.json package has this structure : 

```bash

{
  "expo": {
    …
    "ios": {
      "bundleIdentifier": "..."
    },
    "android": {
      "package": "..."
    },
    …
  }
}

```

The bundleIdentifier and package should be unique and match the App Store / Play Store.

Then, build the releases with the following commands : 

**Android** : 

```bash 
npx eas build \--platform android
```

**IOS** : 

```bash 
npx eas build \--platform ios
```

If this is your first time, you’ll be prompted to set up credentials (Expo can manage them for you);

**Install or publish :** 

If you want to install the APK file, then use the command : 

```bash 
adb install \<file\>.apk
```

To publish on App Store / Play Store, upload the generated .aab / .ipa.

**Optional : Build Locally**

You can build locally the app by using : 

```bash 
# for Andriod 
npx expo run:android \--variant release

# for iOS
npx expo run:ios \--configuration Release
```

This compiles the app on your own machine, but you need Android Studio or Xcode installed.
