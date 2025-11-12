# Troubleshooting Spotify Export

If the "Export to Spotify" button doesn't do anything when clicked, try the following:

## Quick Debug Steps

1. **Check Console Logs**
   - Open your development console
   - Click the "Export to Spotify" button
   - Look for these logs:
     - "Export button clicked, opening modal"
     - "Modal visible, checking Spotify auth..."
     - "Rendering SpotifyExportModal, visible: true"

2. **Verify Environment Variables**
   - Make sure `.env` file exists in the `vynl/` directory
   - Check that `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` is set
   - Restart your Expo dev server after adding environment variables

3. **Check Modal Rendering**
   - The modal should appear as a bottom sheet
   - If you see a dark overlay but no content, there might be a styling issue
   - If nothing appears at all, check for JavaScript errors in the console

## Common Issues

### Issue: Button click does nothing
**Solution**: 
- Check if the button is disabled (shouldn't be if playlist has songs)
- Verify `showExportModal` state is updating (check React DevTools)
- Look for errors in console that might be blocking the click handler

### Issue: Modal doesn't appear
**Possible causes**:
- Modal component not rendering due to an error
- Z-index or styling issues hiding the modal
- React Native Modal not supported on your platform

**Solution**:
- Check console for errors
- Try adding a simple Alert to verify the button works:
  ```tsx
  onPress={() => {
    Alert.alert('Test', 'Button clicked');
    setShowExportModal(true);
  }}
  ```

### Issue: Modal appears but is blank/white
**Solution**:
- Check if authentication check is hanging
- Look for errors in `isSpotifyAuthenticated()` function
- Verify AsyncStorage is working correctly

### Issue: "Spotify Client ID is not configured" error
**Solution**:
- Make sure `.env` file is in the `vynl/` directory (not the root)
- Restart Expo dev server after adding environment variables
- Verify the variable name is exactly `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`

## Testing the Modal Manually

To test if the modal works independently:

1. Add this to your playlist detail screen temporarily:
   ```tsx
   <Button title="Test Modal" onPress={() => setShowExportModal(true)} />
   ```

2. Or test the modal directly by setting initial state:
   ```tsx
   const [showExportModal, setShowExportModal] = useState(true); // Start with true
   ```

## Next Steps

If the modal still doesn't appear after checking the above:
1. Check the React Native debugger
2. Look for any red error screens
3. Verify all dependencies are installed: `npm install`
4. Try clearing the cache: `npx expo start -c`

