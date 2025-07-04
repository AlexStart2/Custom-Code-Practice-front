import {create} from 'zustand';

export const useAuthStore = create((set) =>({
    user: null,
    isLoggedIn: false,
    setUser: (user) => set({user, isLoggedIn: true}),
    logout: ()=>set({user:null, isLoggedIn: false}),
}));