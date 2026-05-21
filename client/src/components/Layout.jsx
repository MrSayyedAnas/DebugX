import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/projects', label: 'Projects', icon: '📁' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-black flex">

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-zinc-950 border-r border-zinc-800 flex flex-col transition-all duration-300`}>

        {/* Logo */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-white">
              Debug<span className="text-red-500">X</span>
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition p-1"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium
                ${location.pathname === item.path
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Info + Logout */}
        <div className="p-3 border-t border-zinc-800">
          {sidebarOpen && (
            <div className="mb-3 px-3">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
              <span className="inline-block mt-1 text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full capitalize">
                {user?.role}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium text-gray-400 hover:bg-zinc-800 hover:text-red-400 w-full`}
          >
            <span className="text-lg">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-zinc-950 border-b border-zinc-800 px-6 py-4">
          <p className="text-gray-400 text-sm">
            Welcome back, <span className="text-white font-medium">{user?.name}</span>
          </p>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}