// Authentication actions

export type AuthAction =
  | {
      type: 'LOGIN_SUCCESS';
      user: { id: string; email: string; displayName: string };
    }
  | { type: 'LOGOUT' };
