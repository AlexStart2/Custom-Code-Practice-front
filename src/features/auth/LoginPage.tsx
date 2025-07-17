import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { Box, Button, TextField, Typography, Link, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { loginUser } from '../../services/authService'
import { useAuthStore } from '../../store/auth'


export default function LoginPage() {
    const navigate = useNavigate();
    const setUser = useAuthStore((state) => state.login);

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        try {
            const {access_token, userData }= await loginUser({ email, password });
            setUser(access_token, userData);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        }
    }

    return (
        <>
            <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
            >
                <Typography variant="h5" align="center" gutterBottom>
                    Login
                </Typography>
                {error && <Typography color="error" align='center'>
                    {error}
                </Typography>}
                <TextField
                label = "Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
                <TextField
                label = "Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                aria-label="toggle password visibility"
                            >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    )
                }}
                />
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                >
                    Login
                </Button>
                <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                    Don't have an account?{' '}
                    <Link component={NavLink} to="/auth/register">
                        Register
                    </Link>
                </Typography>
            </Box>
        </>
    );
}