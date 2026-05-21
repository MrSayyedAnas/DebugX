import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#a855f7", "#22c55e", "#6b7280"];

export default function Analytics() {
  const [projects, setProjects]       = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [trends, setTrends]           = useState([]);
  const [projectStats, setProjectStats] = useState(null);
  const [teamData, setTeamData]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  // Fetch all projects first
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/projects");
        const raw = res.data.data?.projects || res.data.data || res.data || [];
        const list = Array.isArray(raw) ? raw : [];
        setProjects(list);
        if (list.length > 0) setSelectedProject(list[0]._id);
      } catch {
        setError("Failed to load projects.");
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Fetch analytics when project changes
  useEffect(() => {
    if (!selectedProject) return;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");
        const [trendsRes, statsRes, teamRes] = await Promise.all([
          api.get(`/analytics/trends/${selectedProject}`),
          api.get(`/stats/projects/${selectedProject}`),
          api.get(`/analytics/team/${selectedProject}`),
        ]);

        const trendsRaw = trendsRes.data.data || trendsRes.data || [];
        setTrends(Array.isArray(trendsRaw) ? trendsRaw : []);

        setProjectStats(statsRes.data.data || statsRes.data || null);

        const teamRaw = teamRes.data.data || teamRes.data || [];
        setTeamData(Array.isArray(teamRaw) ? teamRaw : []);
      } catch {
        setError("Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedProject]);

  const statusDist = projectStats ? [
    { name: "Open",        value: projectStats.openBugs        || projectStats.open        || 0 },
    { name: "In Progress", value: projectStats.inProgressBugs  || projectStats.in_progress || 0 },
    { name: "Resolved",    value: projectStats.resolvedBugs    || projectStats.resolved    || 0 },
    { name: "Closed",      value: projectStats.closedBugs      || projectStats.closed      || 0 },
  ].filter(d => d.value > 0) : [];

  const totalBugs = statusDist.reduce((a, b) => a + b.value, 0);

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-zinc-400 text-sm mt-1">Bug trends and team performance</p>
          </div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-600 transition-colors"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950 border border-red-800 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 animate-pulse h-48"/>
            ))}
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Bugs"  value={totalBugs} color="text-white" />
              <StatCard label="Open"        value={projectStats?.openBugs       || projectStats?.open        || 0} color="text-blue-400" />
              <StatCard label="In Progress" value={projectStats?.inProgressBugs || projectStats?.in_progress || 0} color="text-purple-400" />
              <StatCard label="Resolved"    value={projectStats?.resolvedBugs   || projectStats?.resolved    || 0} color="text-green-400" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              {/* Bug Trends Line Chart */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Bug Trends</h3>
                {trends.length === 0 ? (
                  <EmptyChart message="No trend data available" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#71717a", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8 }}
                        labelStyle={{ color: "#fff" }}
                        itemStyle={{ color: "#a1a1aa" }}
                      />
                      <Line type="monotone" dataKey="opened" stroke="#ef4444" strokeWidth={2} dot={false} name="Opened" />
                      <Line type="monotone" dataKey="closed" stroke="#22c55e" strokeWidth={2} dot={false} name="Closed" />
                      <Line type="monotone" dataKey="total"  stroke="#3b82f6" strokeWidth={2} dot={false} name="Total" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Status Distribution Pie */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Status Distribution</h3>
                {statusDist.length === 0 ? (
                  <EmptyChart message="No bugs in this project yet" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={statusDist}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusDist.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8 }}
                        itemStyle={{ color: "#a1a1aa" }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(val) => <span style={{ color: "#a1a1aa", fontSize: 12 }}>{val}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Team Performance Bar Chart */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 mb-6">
              <h3 className="text-white font-semibold text-sm mb-4">Team Performance</h3>
              {teamData.length === 0 ? (
                <EmptyChart message="No team data available" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={teamData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8 }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#a1a1aa" }}
                    />
                    <Bar dataKey="resolved" fill="#22c55e" radius={[4,4,0,0]} name="Resolved" />
                    <Bar dataKey="assigned" fill="#3b82f6" radius={[4,4,0,0]} name="Assigned" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Team Table */}
            {teamData.length > 0 && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-zinc-800">
                  <h3 className="text-white font-semibold text-sm">Developer Metrics</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {["Developer","Assigned","Resolved","Resolution Rate","Avg Time"].map(h => (
                        <th key={h} className="text-left text-xs text-zinc-500 font-medium px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamData.map((dev, i) => {
                      const rate = dev.assigned > 0
                        ? Math.round((dev.resolved / dev.assigned) * 100)
                        : 0;
                      return (
                        <tr key={i} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-900 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-red-900 flex items-center justify-center text-xs font-medium text-red-300">
                                {(dev.name || "U")[0].toUpperCase()}
                              </div>
                              <span className="text-white text-sm">{dev.name || "Unknown"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-zinc-300 text-sm">{dev.assigned || 0}</td>
                          <td className="px-5 py-3 text-zinc-300 text-sm">{dev.resolved || 0}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-zinc-800 rounded-full h-1.5 max-w-24">
                                <div
                                  className="bg-green-500 h-1.5 rounded-full"
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                              <span className="text-zinc-300 text-sm">{rate}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-zinc-300 text-sm">
                            {dev.avgResolutionTime ? `${dev.avgResolutionTime}h` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <p className="text-zinc-500 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">{message}</div>
  );
}