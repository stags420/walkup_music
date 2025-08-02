/**
 * Test data fixtures for e2e tests
 */

export interface TestPlayer {
  name: string;
  song?: {
    title: string;
    artist: string;
  };
}

export const testPlayers: TestPlayer[] = [
  {
    name: 'Mike Trout',
    song: {
      title: 'Thunderstruck',
      artist: 'AC/DC',
    },
  },
  {
    name: 'Aaron Judge',
    song: {
      title: 'All Star',
      artist: 'Smash Mouth',
    },
  },
  {
    name: 'Mookie Betts',
    song: {
      title: 'Pump It',
      artist: 'Black Eyed Peas',
    },
  },
  {
    name: 'Ronald Acuña Jr.',
    song: {
      title: 'Gasolina',
      artist: 'Daddy Yankee',
    },
  },
  {
    name: 'Vladimir Guerrero Jr.',
    song: {
      title: 'Despacito',
      artist: 'Luis Fonsi',
    },
  },
];

export const testPlayersWithoutSongs: TestPlayer[] = [
  { name: 'Test Player 1' },
  { name: 'Test Player 2' },
  { name: 'Test Player 3' },
];

export const mockSongs = [
  {
    title: 'Thunderstruck',
    artist: 'AC/DC',
    album: 'The Razors Edge',
  },
  {
    title: 'All Star',
    artist: 'Smash Mouth',
    album: 'Astro Lounge',
  },
  {
    title: 'Pump It',
    artist: 'Black Eyed Peas',
    album: 'Monkey Business',
  },
  {
    title: 'Gasolina',
    artist: 'Daddy Yankee',
    album: 'Barrio Fino',
  },
  {
    title: 'Despacito',
    artist: 'Luis Fonsi',
    album: 'Vida',
  },
];
