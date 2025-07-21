import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "./SideBar";


export default function DashboardLayout() {
  return (
    <Box display="flex" height="100%">
      <Sidebar />
      <Box component="main" flexGrow={1} p={3}>
        <Outlet />
      </Box>
    </Box>
  );
}
