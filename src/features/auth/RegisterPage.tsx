
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { registerUser } from '../../services/authService';
import { Box, Typography, TextField, Button, Link } from '@mui/material';


export default function RegisterPage() {
    const navigate = useNavigate();
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        try {
            await registerUser({ name, email, password });
            navigate('/auth/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    }

    return (

        <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            >
                <Typography variant="h5" align="center" gutterBottom>
                    Register
                </Typography>
                {error && <Typography color="error" align='center'>
                    {error}
                </Typography>}
                <TextField
                    label="Name"
                    type="text"
                    fullWidth
                    margin="normal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                >
                    Register
                </Button>
                <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                    Already have an account?{' '}
                    <Link component={NavLink} to="/auth/login">
                        Login
                    </Link>
                </Typography>
            </Box>

    )
}