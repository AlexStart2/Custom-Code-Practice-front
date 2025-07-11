import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../components/LayoutAuth';
import LayoutRoot from '../components/LayoutRoot';
import DashboardLayout from '../features/dashboard/DashboardLayout';
import Overview from '../features/dashboard/Overview';
import Datasets from '../features/dashboard/Datasets';
import TrainingJobs from '../features/dashboard/TrainingJobs';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import HelpPage from '../features/help/HelpPage';
import Models from '../features/dashboard/Models';
import Settings from '../features/dashboard/Settings';
import DatasetsUpload from '../features/dashboard/DatasetsUpload';
import { useAuthStore } from '../store/auth';

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
                </Route>
                <Route path="training" element={<TrainingJobs />} />
                <Route path="models" element={<Models />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="" replace />} />
            </Route>
    
            {/* Public help page */}
            <Route path="help" element={<HelpPage />} />
    
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Route>
        </Routes>
    );
}