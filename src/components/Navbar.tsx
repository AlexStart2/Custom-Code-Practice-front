import { useAuthStore } from '../store/auth';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate()
  const { isLoggedIn, logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <AppBar position="static" color="transparent" elevation={1}>
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/dashboard"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          >
            Trainify
          </Typography>

          {isLoggedIn ? (
            <>
              <Typography sx={{ mr: 2 }}>Hi, {user?.name}</Typography>
              <Button color="error" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button component={RouterLink} to="/auth/login">
                Login
              </Button>
              <Button component={RouterLink} to="/auth/register">
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
  );
}
