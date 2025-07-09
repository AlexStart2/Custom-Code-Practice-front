import { Routes, Route, Navigate} from 'react-router-dom'
import LayoutRoot from './components/LayoutRoot'
import AuthLayout from './components/LayoutAuth'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import DashboardPage from './features/dashboard/DashboardPage'
import { useAuthStore } from './store/auth'


function App() {
  const { isLoggedIn } = useAuthStore();

  return (
    <Routes>
      <Route element={<LayoutRoot />}>
        <Route path="auth" element={<AuthLayout />}>
          <Route index element={<Navigate to="login" replace />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route
          path="dashboard"
          element={isLoggedIn ? <DashboardPage /> : <Navigate to="/auth/login" replace />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/auth/login" replace />} />
      <Route index element={<Navigate to="/auth/login" replace />} />
    </Routes>

  )
}

export default App
