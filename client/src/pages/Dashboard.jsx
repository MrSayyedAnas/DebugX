import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'
import {
  Bug, TrendingUp, Clock, CheckCircle2,
  FolderOpen, Users, ChevronDown, Plus,
  AlertTriangle, Circle,
} from 'lucide-react'

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, subtitle, color, icon: Icon, iconColor }) => (
  <div className="bg-[#1e1d1c] border border-zinc-800 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-colors">
    {/* Background glow */}
    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full opacity-5 blur-xl ${iconColor}`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className={`text-4xl font-bold mt-2 ${color}`}>{value}</p>
        {subtitle && <p className="text-gray-600 text-xs mt-1">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor} bg-opacity-10`}
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <Icon size={18} className={color} />
        </div>
      )}
    </div>
  </div>
)

// ─── Bug Status Badge ─────────────────────────────────────────────────────────
const BugStatusBadge = ({ status }) => {
  const colors = {
    open: 'bg-red-500/20 text-red-400',
    in_progress: 'bg-yellow-500/20 text-yellow-400',
    resolved: 'bg-green-500/20 text-green-400',
    closed: 'bg-gray-500/20 text-gray-400',
    reopened: 'bg-orange-500/20 text-orange-400',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[status] || colors.open}`}>
      {status?.replace('_', ' ').toUpperCase()}
    </span>
  )
}

// ─── Priority Badge ───────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const colors = {
    critical: 'bg-red-500/20 text-red-400',
    high: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-green-500/20 text-green-400',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[priority] || colors.medium}`}>
      {priority?.toUpperCase()}
    </span>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [projects, setProjects]           = useState([])
  const [selectedProjectId, setSelected]  = useState(null)
  const [stats, setStats]                 = useState(null)
  const [recentBugs, setRecentBugs]       = useState([])
  const [loading, setLoading]             = useState(true)
  const [statsLoading, setStatsLoading]   = useState(false)
  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => { fetchProjects() }, [])
  useEffect(() => { if (selectedProjectId) fetchProjectStats(selectedProjectId) }, [selectedProjectId])

  const fetchProjects = async () => {
    try {
      const res = await API.get('/projects')
      const list = res.data.data.projects
      setProjects(list)
      if (list.length > 0) setSelected(list[0]._id)
    } catch (err) {
      console.error('Dashboard error:', err)
      toast.error('Failed to load projects.')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectStats = async (projectId) => {
    try {
      setStatsLoading(true)
      const [statsRes, bugsRes] = await Promise.all([
        API.get(`/stats/projects/${projectId}`),
        API.get(`/bugs/project/${projectId}`),
      ])
      setStats(statsRes.data.data.stats)
      setRecentBugs(bugsRes.data.data.bugs?.slice(0, 5) || [])
    } catch (err) {
      console.error('Stats error:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const selectedProject = projects.find(p => p._id === selectedProjectId)

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 text-lg animate-pulse">Loading...</div>
      </div>
    </Layout>
  )

  return (
    <Layout>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">
            {selectedProject ? `Viewing: ${selectedProject.name}` : 'Select a project to view stats'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">

          {/* ── Project Selector Dropdown ─────────────────────────────────── */}
          {projects.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2 hover:border-zinc-500 transition-colors focus:outline-none focus:border-red-600"
              >
                <FolderOpen size={15} className="text-red-400" />
                <span className="max-w-[160px] truncate">{selectedProject?.name || 'Select project'}</span>
                <ChevronDown
                  size={14}
                  className={`text-zinc-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full mt-1 right-0 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl min-w-[200px] overflow-hidden">
                  {projects.map(p => (
                    <button
                      key={p._id}
                      onClick={() => { setSelected(p._id); setDropdownOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-zinc-800 ${
                        p._id === selectedProjectId ? 'text-red-400 bg-zinc-800/50' : 'text-zinc-300'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={15} /> New Project
            </button>
          )}
        </div>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-zinc-700 rounded-2xl">
          <FolderOpen size={36} className="text-zinc-600 mb-4" />
          <p className="text-white font-medium">No projects yet</p>
          <p className="text-gray-500 text-sm mt-1">Create your first project to get started</p>
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/projects')}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm transition-colors"
            >
              Create Project
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Stat Cards ────────────────────────────────────────────────── */}
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-[#1e1d1c] border border-zinc-800 rounded-xl p-6 animate-pulse">
                  <div className="h-3 bg-zinc-800 rounded w-1/2 mb-3" />
                  <div className="h-8 bg-zinc-800 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Bugs"
                value={stats?.bugs?.total || 0}
                subtitle="All time"
                color="text-white"
                icon={Bug}
              />
              <StatCard
                title="Open Bugs"
                value={stats?.bugs?.byStatus?.open || 0}
                subtitle="Needs attention"
                color="text-red-500"
                icon={AlertTriangle}
              />
              <StatCard
                title="In Progress"
                value={stats?.bugs?.byStatus?.in_progress || 0}
                subtitle="Being worked on"
                color="text-yellow-500"
                icon={Clock}
              />
              <StatCard
                title="Resolved"
                value={(stats?.bugs?.byStatus?.resolved || 0) + (stats?.bugs?.byStatus?.closed || 0)}
                subtitle="Fixed bugs"
                color="text-green-500"
                icon={CheckCircle2}
              />
            </div>
          )}

          {/* ── Two Column: Recent Bugs + Priority ───────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent Bugs */}
            <div className="bg-[#1e1d1c] border border-zinc-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Recent Bugs</h3>
                <button
                  onClick={() => navigate(`/projects/${selectedProjectId}/bugs`)}
                  className="text-red-400 text-sm hover:text-red-300 transition-colors"
                >
                  View all →
                </button>
              </div>

              {recentBugs.length === 0 ? (
                <p className="text-gray-500 text-sm">No bugs reported yet</p>
              ) : (
                <div className="space-y-3">
                  {recentBugs.map(bug => (
                    <div
                      key={bug._id}
                      // ✅ FIXED: was navigate(`/projects/${selectedProjectId}/bugs/${bug._id}`)
                      onClick={() => navigate(`/bugs/${bug._id}`)}
                      className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{bug.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{bug.category?.replace('_', ' ')}</p>
                      </div>
                      <div className="flex gap-2 ml-3 shrink-0">
                        <PriorityBadge priority={bug.priority} />
                        <BugStatusBadge status={bug.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Priority + Category breakdown */}
            <div className="bg-[#1e1d1c] border border-zinc-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Bugs by Priority</h3>
              <div className="space-y-3">
                {[
                  { label: 'Critical', key: 'critical', color: 'bg-red-500'    },
                  { label: 'High',     key: 'high',     color: 'bg-orange-500' },
                  { label: 'Medium',   key: 'medium',   color: 'bg-yellow-500' },
                  { label: 'Low',      key: 'low',      color: 'bg-green-500'  },
                ].map(({ label, key, color }) => {
                  const count   = stats?.bugs?.byPriority?.[key] || 0
                  const total   = stats?.bugs?.total || 1
                  const percent = Math.round((count / total) * 100)
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">{label}</span>
                        <span className="text-white font-medium">{count}</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2">
                        <div
                          className={`${color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <h3 className="text-white font-semibold mt-6 mb-4">Bugs by Category</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(stats?.bugs?.byCategory || {}).map(([cat, count]) => (
                  <div key={cat} className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-gray-400 text-xs capitalize">{cat.replace('_', ' ')}</p>
                    <p className="text-white font-bold text-lg">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Projects Grid ────────────────────────────────────────────── */}
          <div className="mt-6 bg-[#1e1d1c] border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <FolderOpen size={16} className="text-red-400" />
                Your Projects
              </h3>
              <button
                onClick={() => navigate('/projects')}
                className="text-red-400 text-sm hover:text-red-300 transition-colors"
              >
                Manage →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map(project => (
                <div
                  key={project._id}
                  onClick={() => navigate(`/projects/${project._id}/bugs`)}
                  className={`bg-zinc-900 rounded-lg p-4 cursor-pointer hover:bg-zinc-800 transition-colors border hover:border-red-500/50 ${
                    project._id === selectedProjectId ? 'border-red-500/50' : 'border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <FolderOpen size={14} className="text-red-400" />
                    </div>
                    {project._id === selectedProjectId && (
                      <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                  <p className="text-white font-medium text-sm">{project.name}</p>
                  <p className="text-gray-500 text-xs mt-1 truncate">{project.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      project.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {project.status}
                    </span>
                    <span className="text-gray-600 text-xs flex items-center gap-1">
                      <Users size={11} />
                      {project.members?.length ?? 0} members
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </>
      )}
    </Layout>
  )
}