import { useAuthStore } from '../store/auth';
import { AppBar, Toolbar, Typography, Button, IconButton, Avatar, Menu, MenuItem } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate()
  const { isLoggedIn, logout, user } = useAuthStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
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
            <Typography variant="body1" sx={{ marginRight: 2 }}>
              Hello, {user?.name}
            </Typography>
            <IconButton 
              onClick={e => setAnchorEl(e.currentTarget)} 
              onKeyDown={handleKeyDown}
              size="small"
            >
              <Avatar sx={{ bgcolor: 'primary.main' }}>{user?.name?.[0]}</Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                Logout
              </MenuItem>
            </Menu>
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
