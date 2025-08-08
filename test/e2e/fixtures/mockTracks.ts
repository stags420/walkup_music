import type { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';

/**
 * Mock Spotify tracks that align with e2e test data
 * These tracks match the songs expected in test-data.ts
 */
export const testMockTracks: SpotifyTrack[] = [
  {
    id: 'test-track-1',
    name: 'Thunderstruck',
    artists: ['AC/DC'],
    album: 'The Razors Edge',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273thunderstruck',
    previewUrl: 'https://p.scdn.co/mp3-preview/thunderstruck',
    durationMs: 292000,
    uri: 'spotify:track:thunderstruck-test',
  },
  {
    id: 'test-track-2',
    name: 'All Star',
    artists: ['Smash Mouth'],
    album: 'Astro Lounge',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273allstar',
    previewUrl: 'https://p.scdn.co/mp3-preview/allstar',
    durationMs: 200000,
    uri: 'spotify:track:allstar-test',
  },
  {
    id: 'test-track-3',
    name: 'Pump It',
    artists: ['Black Eyed Peas'],
    album: 'Monkey Business',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273pumpit',
    previewUrl: 'https://p.scdn.co/mp3-preview/pumpit',
    durationMs: 215000,
    uri: 'spotify:track:pumpit-test',
  },
  {
    id: 'test-track-4',
    name: 'Gasolina',
    artists: ['Daddy Yankee'],
    album: 'Barrio Fino',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273gasolina',
    previewUrl: 'https://p.scdn.co/mp3-preview/gasolina',
    durationMs: 195000,
    uri: 'spotify:track:gasolina-test',
  },
  {
    id: 'test-track-5',
    name: 'Despacito',
    artists: ['Luis Fonsi'],
    album: 'Vida',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273despacito',
    previewUrl: 'https://p.scdn.co/mp3-preview/despacito',
    durationMs: 228000,
    uri: 'spotify:track:despacito-test',
  },
  // Add some additional tracks for variety in search results
  {
    id: 'test-track-6',
    name: 'Eye of the Tiger',
    artists: ['Survivor'],
    album: 'Eye of the Tiger',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273eyeoftiger',
    previewUrl: 'https://p.scdn.co/mp3-preview/eyeoftiger',
    durationMs: 245000,
    uri: 'spotify:track:eyeoftiger-test',
  },
  {
    id: 'test-track-7',
    name: 'We Will Rock You',
    artists: ['Queen'],
    album: 'News of the World',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273wewillrockyou',
    previewUrl: 'https://p.scdn.co/mp3-preview/wewillrockyou',
    durationMs: 122000,
    uri: 'spotify:track:wewillrockyou-test',
  },
  {
    id: 'test-track-8',
    name: 'Welcome to the Jungle',
    artists: ["Guns N' Roses"],
    album: 'Appetite for Destruction',
    albumArt: 'https://i.scdn.co/image/ab67616d0000b273welcometojungle',
    previewUrl: 'https://p.scdn.co/mp3-preview/welcometojungle',
    durationMs: 267000,
    uri: 'spotify:track:welcometojungle-test',
  },
];
