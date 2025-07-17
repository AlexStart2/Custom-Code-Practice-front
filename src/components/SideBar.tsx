// src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import { Box, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon   from '@mui/icons-material/Storage';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import SettingsIcon  from '@mui/icons-material/Settings';

const links = [
  { to: '/dashboard',        label: 'Overview',     icon: <DashboardIcon /> },
  { to: '/dashboard/datasets',   label: 'Datasets',     icon: <StorageIcon /> },
  { to: '/dashboard/jobs',   label: 'Current Jobs',icon: <PlaylistAddCheckIcon/> },
  // { to: '/dashboard/models',     label: 'Trained Models',       icon: <ModelTrainingIcon /> },
  { to: '/dashboard/ask',        label: 'Ask RAG',     icon: <PlayCircleOutlineIcon /> },
  { to: '/dashboard/settings',   label: 'Settings',     icon: <SettingsIcon /> },
];

export default function Sidebar() {
  return (
    <Box
      component="nav"
      sx={{
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
  );
}