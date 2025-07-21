import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../components/LayoutAuth';
import LayoutRoot from '../components/LayoutRoot';
import DashboardLayout from '../components/DashboardLayout';
import Overview from '../features/dashboard/Overview';
import Datasets from '../features/dashboard/Datasets';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import HelpPage from '../features/help/HelpPage';
import Settings from '../features/dashboard/Settings';
import DatasetsUpload from '../features/dashboard/DatasetsUpload';
import AskPage from '../features/dashboard/AskChat';
import { useAuthStore } from '../store/auth';
import DatasetDetail from '../features/dashboard/DatasetsDetail';
import JobStatus from '../features/dashboard/JobStatus';

export default function AppRoutes() {
  const { isLoggedIn } = useAuthStore();
    return (
        <Routes>
            <Route path="/" element={<LayoutRoot />}>
                {/* Auth */}
                <Route path="auth" element={<AuthLayout />}>
                    <Route index element={<Navigate to="login" replace />} />
                    <Route path="login" element={<LoginPage />} />
                    <Route path="register" element={<RegisterPage />} />
                </Route>

                {/* Main */}
                <Route
                path="dashboard"
                element={isLoggedIn ? <DashboardLayout /> : <Navigate to="/auth/login" replace />}
                >
                    <Route index element={<Overview />} />
                    <Route path="datasets">
                        <Route index element={<Datasets />} />
                        <Route path="upload" element={<DatasetsUpload />} />
                        <Route path=":id" element={<DatasetDetail />} />
                    </Route>
                    <Route path="jobs" element={<JobStatus />} />
                    <Route path="ask" element={<AskPage />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="" replace />} />
                </Route>
        
                {/* Public help page */}
                <Route path="help" element={<HelpPage />} />
        
                {/* Catch-all */}
                
            </Route>   
            <Route path="*" element={<Navigate to="/auth/login" replace />} /> 
        </Routes>
    );
}