import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages (we'll build these next)
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import BugList from './pages/BugList'
import BugDetail from './pages/BugDetail'
import Analytics from './pages/Analytics'
// DebugX Frontend v1.0.0
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// Protected Route — redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-purple-600 text-xl">Loading...</div>
    </div>
  )

  return user ? children : <Navigate to="/login" replace />
}

// Public Route — redirects to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-purple-600 text-xl">Loading...</div>
    </div>
  )

  return !user ? children : <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute><Register /></PublicRoute>
      } />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/projects/:projectId/bugs" element={<ProtectedRoute><BugList /></ProtectedRoute>} />
      <Route path="/projects/:projectId/bugs/:bugId" element={<ProtectedRoute><BugDetail /></ProtectedRoute>} />
      <Route path="/analytics" element={
        <ProtectedRoute><Analytics /></ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App