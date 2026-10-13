import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CustomerUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role?: string;
  is_blocked?: boolean;
  email_verified: boolean;
}

interface AuthState {
  user: CustomerUser | null;
  token: string | null;
}

const getInitialState = (): AuthState => {
  if (typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      return {
        user: savedUser ? JSON.parse(savedUser) : null,
        token: savedToken || null,
      };
    } catch (e) {
      console.error('Failed to load auth state from localStorage', e);
    }
  }
  return {
    user: null,
    token: null,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setSession(state, action: PayloadAction<{ user: CustomerUser; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('token', action.payload.token);
      }
    },
    clearSession(state) {
      state.user = null;
      state.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
