# Mobile Playback Troubleshooting Guide

## The Issue

If music playback isn't working on your mobile device (especially iOS Safari or Chrome Android), this is likely due to mobile browser autoplay policies and Spotify Web Playback SDK limitations.

## Root Cause

Mobile browsers have strict autoplay policies that require:
1. User interaction before any audio can play
2. The Spotify Player to be initialized within a user interaction event
3. Proper handling of autoplay failures

## What We've Fixed

The app now:
- ✅ Delays Spotify SDK initialization until the first play attempt (user interaction)
- ✅ Handles autoplay failures gracefully
- ✅ Provides better error logging for mobile issues
- ✅ Follows mobile browser best practices

## Quick Solutions

### For Users:

1. **Make sure you're logged into Spotify** in another tab or app
2. **Try clicking play twice** if it doesn't work the first time
3. **Check Chrome settings** (Android):
   - Go to Settings > Site settings > Sound
   - Make sure the app's domain is allowed to play sound
   - Reset "Protected content" settings if needed

### For iOS Safari:

1. **Ensure you have a Spotify Premium account** (required for SDK)
2. **Try refreshing the page** and clicking play again
3. **Make sure Safari isn't in Low Power Mode**

### For Chrome Android:

1. **Check DRM settings**:
   - Go to `chrome://settings/content/protectedContent`
   - Make sure "Allow sites to play protected content" is enabled
2. **Clear browser cache** for the app
3. **Try Chrome Canary** as a workaround if regular Chrome fails

## Known Issues

- **EME Error on Chrome Android 111+**: This is a known issue with newer Chrome versions
- **iOS Autoplay Restrictions**: Safari has stricter policies than other browsers
- **Network Connectivity**: Poor connection can cause initialization failures

## Debugging

Open your browser's developer console and look for:
- `Spotify Web Playback SDK is ready with device ID: ...` (success)
- `Autoplay failed due to browser autoplay policy` (expected on mobile)
- `EMEError: No supported keysystem was found` (Chrome Android issue)
- `Failed to initialize Spotify playback` (general failure)

## When to Contact Support

If none of the above solutions work:
1. Note your device and browser versions
2. Check the browser console for specific error messages
3. Try a different browser to isolate the issue
4. Verify your Spotify Premium subscription is active

## Technical Details

The app uses the Spotify Web Playback SDK which has inherent limitations on mobile:
- Requires Spotify Premium subscription
- Limited mobile browser support
- Subject to browser autoplay policies
- Requires active internet connection

The recent fix ensures the SDK is initialized properly for mobile browsers by delaying initialization until user interaction occurs.