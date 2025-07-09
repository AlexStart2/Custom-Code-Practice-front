
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './index.css';
import App from './App';
import { useAuthStore } from './store/auth';
import axios from 'axios';

const rootElement = document.getElementById('root');
const token = localStorage.getItem('authToken');
const userJson = localStorage.getItem('authUser');

if (token && userJson) {
  const user = JSON.parse(userJson);
  useAuthStore.getState().login(token, user);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
})

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </StrictMode>
  );
} else {
  throw new Error("Root element not found");
}
