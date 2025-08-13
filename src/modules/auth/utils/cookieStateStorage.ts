import type { StateStorage } from 'zustand/middleware';

export const cookieStateStorage: StateStorage = {
  // Zustand StateStorage.getItem should return null when not found.

  getItem: (name: string) => {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));
    const raw = match?.split('=')[1];
    // eslint-disable-next-line unicorn/no-null
    return raw ? decodeURIComponent(raw) : null;
  },
  setItem: (name: string, value: string) => {
    const secure = globalThis.location.protocol === 'https:';
    // eslint-disable-next-line unicorn/no-document-cookie
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; samesite=strict${secure ? '; secure' : ''}`;
  },
  removeItem: (name: string) => {
    // eslint-disable-next-line unicorn/no-document-cookie
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  },
};
