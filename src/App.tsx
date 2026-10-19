import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ActingCustomerProvider } from './context/ActingCustomerContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Board } from './pages/Board'
import { Jobs } from './pages/Jobs'
import { Accounts } from './pages/admin/Accounts'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <ActingCustomerProvider>
                  <Layout />
                </ActingCustomerProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/board" element={<Board />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route
              path="/admin/accounts"
              element={
                <ProtectedRoute adminOnly>
                  <Accounts />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/board" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
