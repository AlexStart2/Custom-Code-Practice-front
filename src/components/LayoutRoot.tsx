
import { Outlet } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';
import Navbar from './Navbar';


export default function LayoutRoot() {

    return (
        <Box display="flex" flexDirection="column" minHeight="100vh">
            <Navbar />

            <Box
                component="main"
                flexGrow={1}
                overflow="auto"
                py={4}
            >
                <Container maxWidth="lg">
                    <Outlet />
                </Container>
            </Box>

            <Box component="footer" py = {2} textAlign="center" bgcolor="grey.100" sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
                <Typography variant='body2' color='textSecondary'>
                    &copy; {new Date().getFullYear()} Trainify. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
}
