import axios from 'axios';
import type { AxiosResponse } from 'axios';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173/api/auth/';

export interface Credentials {
    email: string;
    password: string;
}
export interface RegisterData extends Credentials {
    name: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
}

export async function loginUser(credentials: Credentials): Promise<User> {
    const response: AxiosResponse<User> = await axios.post(`${API_URL}/auth/login`, 
        credentials, 
        {withCredentials: true,}
    );
    return response.data;
}

export async function registerUser(data:RegisterData):  Promise<void> {
    await axios.post(`${API_URL}/auth/register`, data, {withCredentials: true});
}