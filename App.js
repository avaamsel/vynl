import { registerRootComponent } from 'expo';
// Import the root layout from the nested project and register it.
// The nested project uses `app/_layout.tsx` as the root layout; import its default export.
import RootLayout from './vynl/app/_layout';

// Register the nested app's root component with Expo.
registerRootComponent(RootLayout);
