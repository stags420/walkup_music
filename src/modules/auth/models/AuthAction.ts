// Authentication actions

export type AuthAction =
  | { type: 'LOGIN_START' }
  | {
      type: 'LOGIN_SUCCESS';
      user: { id: string; email: string; displayName: string };
    }
  | { type: 'LOGIN_ERROR'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; loading: boolean };
