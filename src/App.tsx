import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import DashboardPage from './features/dashboard/DashboardPage'
import { useAuthStore } from './store/auth'


function App() {
  const { isLoggedIn } = useAuthStore();

  return (
    <Routes>
      <Route path="/" element={<Layout />} />
      {/* Public */}
      <Route index element={<LoginPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path='/register' element={<RegisterPage />} />

      {/*Protected */}

      <Route
        path='/dashboard'
        element={isLoggedIn ? <DashboardPage /> : <Navigate to='/login' replace />}
      />


      {/*Fallback */}

      <Route
        path='*'
        element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  )
}

export default App
