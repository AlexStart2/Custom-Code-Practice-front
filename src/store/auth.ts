import { create } from 'zustand';
import type { User } from '../services/authService';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
    user: User | null;
    isLoggedIn: boolean;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
}

interface JwtPayload {
  sub: string;
  exp: number;
}


export const useAuthStore = create<AuthState>((set) => {
  // Try to load from localStorage
  const tokenInStorage = localStorage.getItem('authToken');
  const userInStorage  = localStorage.getItem('authUser');

  let validToken: string | null = null;
  let validUser: User | null     = null;

  if (tokenInStorage && userInStorage) {
    try {
      // just to check exp:
      const { exp } = jwtDecode<JwtPayload>(tokenInStorage);
      if (exp * 1000 > Date.now()) {
        // Still valid
        validToken = tokenInStorage;
        validUser  = JSON.parse(userInStorage);
        axios.defaults.headers.common['Authorization'] = `Bearer ${validToken}`;
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    } catch {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
  }

  return {
    user: userInStorage ? JSON.parse(userInStorage) : null,
    token: tokenInStorage,
    isLoggedIn: !!tokenInStorage,
    login: (token, user) => {
      set({ token, user, isLoggedIn: true });
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },
    logout: () => {
      set({ token: null, user: null, isLoggedIn: false });
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      delete axios.defaults.headers.common['Authorization'];
    },
  };
});









// export const useAuthStore = create<AuthState>((set) => ({

    


//     user: null,
//     isLoggedIn: false,
//     token: null,
//     login: (token, user) => {
//         set({ token, user, isLoggedIn: true });
//         localStorage.setItem('authToken', token);
//         localStorage.setItem('authUser', JSON.stringify(user));
//         axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     },
//     logout: () => {
//         set({ token: null, user: null, isLoggedIn: false });
//         localStorage.removeItem('authToken');
//         localStorage.removeItem('authUser');
//         delete axios.defaults.headers.common['Authorization'];
//     },

// }));