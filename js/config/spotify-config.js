/**
 * Spotify API Configuration
 * 
 * This file contains the configuration for the Spotify Web API integration.
 * To use this application, you need to register a Spotify Developer Application
 * and update the clientId and redirectUri values below.
 * 
 * Registration steps:
 * 1. Go to https://developer.spotify.com/dashboard/
 * 2. Log in with your Spotify account
 * 3. Click "Create an App"
 * 4. Fill in the app name (e.g., "Walk-up Music App") and description
 * 5. Accept the terms and conditions
 * 6. Once created, you'll see your Client ID on the dashboard
 * 7. Click "Edit Settings" and add your redirect URI (must match the redirectUri below)
 *    - For local development: http://localhost:5500/callback.html
 *    - For GitHub Pages: https://yourusername.github.io/your-repo-name/callback.html
 * 8. Save the settings
 * 9. Copy your Client ID and update the clientId value below
 */

const spotifyConfig = {
    // Replace with your actual Client ID from the Spotify Developer Dashboard
    clientId: '7534de4cf2c14614846f1b0ca26a5400',
    
    // The URI where Spotify will redirect after authentication
    // This must exactly match one of the Redirect URIs in your Spotify App settings
    redirectUri: 'https://stags420.github.io/walkup_music/callback.html',
    
    // The scopes define the permissions your app is requesting
    // For this app, we need:
    // - user-read-private: Read access to user's subscription details
    // - user-read-email: Read access to user's email address
    // - streaming: Control playback of Spotify tracks
    // - user-read-playback-state: Read access to user's playback state
    // - user-modify-playback-state: Write access to user's playback state
    scopes: [
        'user-read-private',
        'user-read-email',
        'streaming',
        'user-read-playback-state',
        'user-modify-playback-state'
    ],
    
    // Spotify API endpoints
    authEndpoint: 'https://accounts.spotify.com/authorize',
    apiBaseUrl: 'https://api.spotify.com/v1'
};

export default spotifyConfig;