import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import API from '../api/axios'

const StatCard = ({ title, value, subtitle, color }) => (
  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
    <p className="text-gray-500 text-sm font-medium">{title}</p>
    <p className={`text-4xl font-bold mt-2 ${color}`}>{value}</p>
    {subtitle && <p className="text-gray-600 text-xs mt-1">{subtitle}</p>}
  </div>
)

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

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState(null)
  const [recentBugs, setRecentBugs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch projects
      const projectsRes = await API.get('/projects')
      const projectsList = projectsRes.data.data.projects
      setProjects(projectsList)

      // Fetch stats for first project if exists
      if (projectsList.length > 0) {
        const statsRes = await API.get(`/stats/projects/${projectsList[0]._id}`)
        setStats(statsRes.data.data.stats)

        // Fetch recent bugs
        const bugsRes = await API.get(`/bugs/project/${projectsList[0]._id}`)
        setRecentBugs(bugsRes.data.data.bugs.slice(0, 5))
      }
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 text-lg animate-pulse">Loading...</div>
      </div>
    </Layout>
  )

  return (
    <Layout>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">
            {projects.length > 0 ? `Showing stats for: ${projects[0]?.name}` : 'No projects yet'}
          </p>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-zinc-700 rounded-2xl">
          <p className="text-4xl mb-4">📁</p>
          <p className="text-white font-medium">No projects yet</p>
          <p className="text-gray-500 text-sm mt-1">Create your first project to get started</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm transition"
          >
            Create Project
          </button>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Bugs"
              value={stats?.bugs?.total || 0}
              subtitle="All time"
              color="text-white"
            />
            <StatCard
              title="Open Bugs"
              value={stats?.bugs?.byStatus?.open || 0}
              subtitle="Needs attention"
              color="text-red-500"
            />
            <StatCard
              title="In Progress"
              value={stats?.bugs?.byStatus?.in_progress || 0}
              subtitle="Being worked on"
              color="text-yellow-500"
            />
            <StatCard
              title="Resolved"
              value={(stats?.bugs?.byStatus?.resolved || 0) + (stats?.bugs?.byStatus?.closed || 0)}
              subtitle="Fixed bugs"
              color="text-green-500"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent Bugs */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Recent Bugs</h3>
                <button
                  onClick={() => navigate(`/projects/${projects[0]._id}/bugs`)}
                  className="text-red-400 text-sm hover:text-red-300 transition"
                >
                  View all →
                </button>
              </div>
              {recentBugs.length === 0 ? (
                <p className="text-gray-500 text-sm">No bugs reported yet</p>
              ) : (
                <div className="space-y-3">
                  {recentBugs.map((bug) => (
                    <div
                      key={bug._id}
                      onClick={() => navigate(`/bugs/${bug._id}`)}
                      className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-800 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{bug.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{bug.category?.replace('_', ' ')}</p>
                      </div>
                      <div className="flex gap-2 ml-3">
                        <PriorityBadge priority={bug.priority} />
                        <BugStatusBadge status={bug.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bugs by Priority */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Bugs by Priority</h3>
              <div className="space-y-3">
                {[
                  { label: 'Critical', key: 'critical', color: 'bg-red-500' },
                  { label: 'High', key: 'high', color: 'bg-orange-500' },
                  { label: 'Medium', key: 'medium', color: 'bg-yellow-500' },
                  { label: 'Low', key: 'low', color: 'bg-green-500' },
                ].map(({ label, key, color }) => {
                  const count = stats?.bugs?.byPriority?.[key] || 0
                  const total = stats?.bugs?.total || 1
                  const percent = Math.round((count / total) * 100)
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">{label}</span>
                        <span className="text-white font-medium">{count}</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2">
                        <div
                          className={`${color} h-2 rounded-full transition-all`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Bugs by Category */}
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

          {/* Projects List */}
          <div className="mt-6 bg-zinc-950 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">Your Projects</h3>
              <button
                onClick={() => navigate('/projects')}
                className="text-red-400 text-sm hover:text-red-300 transition"
              >
                Manage →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project._id}
                  onClick={() => navigate(`/projects/${project._id}/bugs`)}
                  className="bg-zinc-900 rounded-lg p-4 cursor-pointer hover:bg-zinc-800 transition border border-zinc-700 hover:border-red-500/50"
                >
                  <p className="text-white font-medium">{project.name}</p>
                  <p className="text-gray-500 text-xs mt-1 truncate">{project.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      project.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {project.status}
                    </span>
                    <span className="text-gray-600 text-xs">
                      {project.members?.length} members
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