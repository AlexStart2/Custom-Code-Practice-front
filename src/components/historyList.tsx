// src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Drawer } from '@mui/material';



export default function HistoryList() {
    const appBarHeight = 64;

  return (
    <Drawer variant="permanent" anchor="right">
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
          {/* {links.map(link => (
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
          ))} */}
        </List>
      </Box>
    </Drawer>
  );
}