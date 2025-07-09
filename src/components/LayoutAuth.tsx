// src/components/AuthLayout.tsx
import { Outlet, Link } from 'react-router-dom';
import { Box, Paper, Typography, Container } from '@mui/material';

export default function AuthLayout() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      bgcolor="grey.100"
      p={2}
      height="80vh"
    >
      <Container maxWidth="xs">
          <Typography variant='h4' align='center' gutterBottom>
            <Link to="/dashboard">Trainify</Link>
          </Typography>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
}
