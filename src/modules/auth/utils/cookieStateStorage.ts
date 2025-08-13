import type { StateStorage } from 'zustand/middleware';

export const cookieStateStorage: StateStorage = {
  getItem: (name: string) => {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));
    const raw = match?.split('=')[1];
    return raw ? decodeURIComponent(raw) : undefined;
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
