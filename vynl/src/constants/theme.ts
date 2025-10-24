/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Main theme colors
const primaryLight = '#F1CCA6';
const secondaryLight = '#F28695';

//TODO Dark theme colors
const primaryDark = '#F1CCA6';
const secondaryDark = '#F28695';

// Status colors
const success = '#4CAF50';
const warning = '#FFC107';
const error = "red";
const info = '#2196F3';

export const Colors = {
  light: {
    // Base colors
    text: '#000000',
    background: '#FFFFFF',
    
    primary: primaryLight,
    secondary: secondaryLight,
    
    // Accent colors
    accent: '#FF4081', // Pink accent
    
    // Status
    success: success,
    warning: warning,
    error: error,
    info: info,

    // UI elements
    border: '#E0E0E0',
    divider: '#EEEEEE',
    icon: '#687076',
    disabled: '#BDBDBD',
    placeholder: '#9E9E9E',
    
    // Tab navigation
    tabIconDefault: '#687076',
    tabIconSelected: primaryLight,
    tabBackground: '#FFFFFF',
  },
  dark: {
    // Base colors
    text: '#ECEDEE',
    background: '#000000',
    
    // Primary colors
    primary: primaryDark,
    secondary: secondaryDark,
    
    // Status
    success: success,
    warning: warning,
    error: error,
    info: info,
    
    // UI elements
    border: '#ffffffff',
    divider: '#333333',
    icon: '#9BA1A6',
    disabled: '#666666',
    placeholder: '#757575',
    
    // Tab navigation
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryDark,
    tabBackground: '#1E1E1E',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
