
import { NavLink } from 'react-router-dom';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Drawer } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon from '@mui/icons-material/Storage';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import SettingsIcon from '@mui/icons-material/Settings';

const links = [
  { to: '/dashboard', label: 'Overview', icon: <DashboardIcon /> },
  { to: '/dashboard/datasets', label: 'Datasets', icon: <StorageIcon /> },
  { to: '/dashboard/jobs', label: 'Jobs', icon: <PlaylistAddCheckIcon /> },
  { to: '/dashboard/ask', label: 'Ask RAG', icon: <PlayCircleOutlineIcon /> },
  { to: '/dashboard/settings', label: 'Settings', icon: <SettingsIcon /> },
];

export default function Sidebar() {
  const appBarHeight = 64;
  return (
    <Drawer variant="permanent">
      <Box
        component="nav"
        sx={{
          position: 'sticky',
          top: appBarHeight,
          height: `calc(100vh - ${appBarHeight}px)`,
          overflowY: 'auto',
          width: 240,
          flexShrink: 0,
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider'
        }}
      >
        <List>
          {links.map(link => (
            <ListItemButton
              key={link.to}
              component={NavLink}
              to={link.to}
              end
              sx={{
                '&.active': {
                  bgcolor: 'action.selected',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                }
              }}
            >
              <ListItemIcon>{link.icon}</ListItemIcon>
              <ListItemText primary={link.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}