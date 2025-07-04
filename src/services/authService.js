import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173/api/auth/';

export async function loginUser(creadentials){
    const response = await axios.post(`${API_URL}/auth/login`, creadentials, {
        withCredentials: true,
    });
    return response.data;
}

export async function registerUser(data){
    const response = await axios.post(`${API_URL}/auth/register`, data );
    return response.data;
}