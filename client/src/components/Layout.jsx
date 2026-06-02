import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  LogOut,
  Bell
} from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Moved inside component so `user` is available
  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />
    },
    {
      path: '/projects',
      label: 'Projects',
      icon: <FolderKanban size={20} />
    },
    ...(user?.role !== 'tester'
      ? [
        {
          path: '/analytics',
          label: 'Analytics',
          icon: <BarChart3 size={20} />
        }
      ]
      : [])
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#070B14] text-white relative overflow-hidden">

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,0,0,0.08),transparent_35%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,0,0,0.05),transparent_35%)]" />

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'
          } relative z-10 bg-[#0B101B]/90 backdrop-blur-xl border-r border-red-500/10 flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-white/5">
          {sidebarOpen && (
            <h1 className="text-3xl font-bold tracking-wide">
              Debug<span className="text-red-500">X</span>
            </h1>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-white transition"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${location.pathname === item.path
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <span className="text-lg">{item.icon}</span>

              {sidebarOpen && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/5">
          {sidebarOpen && (
            <div className="mb-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center font-bold text-lg">
                {user?.name?.charAt(0)}
              </div>

              <div className="min-w-0">
                <p className="font-medium truncate">
                  {user?.name}
                </p>

                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>

                <span className="inline-block mt-1 text-[10px] uppercase tracking-wider bg-red-500/15 text-red-400 px-2 py-1 rounded-full">
                  {user?.role}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-red-400 transition"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative z-10">

        {/* Top Bar */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-[#0B101B]/50 backdrop-blur-xl">

          <div>
            <p className="text-gray-400 text-sm">
              Welcome back,
              <span className="text-white font-semibold ml-2">
                {user?.name}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative">
              <Bell size={20} />

              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}