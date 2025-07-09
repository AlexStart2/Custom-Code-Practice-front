import { create } from 'zustand';
import type { User } from '../services/authService';
import axios from 'axios';

interface AuthState {
    user: User | null;
    isLoggedIn: boolean;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoggedIn: false,
    token: null,
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

}));