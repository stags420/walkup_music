# Spotify Walk-up Music App

A web application that allows baseball team managers or players to create and manage walk-up music playlists using Spotify. Users can authenticate with Spotify, create a list of players, select and segment songs for each player, arrange them in a batting order, and play them sequentially during a game.

## Setup Instructions

### 1. Register a Spotify Developer Application

Before you can use this application, you need to register a Spotify Developer Application to obtain a Client ID.

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the app details:
   - **App name**: Walk-up Music App (or your preferred name)
   - **App description**: A web application for managing baseball walk-up music playlists
   - Accept the terms and conditions
5. Click "Create"
6. Once created, you'll see your Client ID on the dashboard
7. Click "Edit Settings" and add your redirect URIs:
   - For local development: `http://localhost:5500/callback.html` (adjust port if needed)
   - For GitHub Pages: `https://yourusername.github.io/your-repo-name/callback.html`
8. Save the settings

### 2. Configure the Application

1. Open the file `js/config/spotify-config.js`
2. Replace `YOUR_SPOTIFY_CLIENT_ID` with the Client ID from your Spotify Developer Dashboard
3. Verify that the `redirectUri` matches one of the URIs you configured in the Spotify Developer Dashboard

### 3. Deploy the Application

#### Local Development

1. Use a local web server to serve the files (e.g., Live Server extension for VS Code)
2. Open the application in your browser

#### GitHub Pages

1. Push the code to your GitHub repository
2. Enable GitHub Pages in your repository settings
3. Set the source to the branch containing your code
4. The application will be available at `https://yourusername.github.io/your-repo-name/`

## Features

- Spotify authentication
- Player management
- Song selection and segmentation
- Batting order management
- Game mode with playback controls
- Local data storage using cookies
- Responsive design for mobile, tablet, and desktop

## Technologies Used

- HTML5
- CSS3 with Bootstrap 5
- JavaScript (ES6+)
- Spotify Web API
- SortableJS for drag-and-drop functionality

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Bootstrap](https://getbootstrap.com/)
- [SortableJS](https://sortablejs.github.io/Sortable/)