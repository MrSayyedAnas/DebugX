import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const statusColors = {
  active:    "bg-green-900 text-green-400",
  completed: "bg-blue-900 text-blue-400",
  archived:  "bg-yellow-900 text-yellow-400",
};

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", status: "active" });
  const [formError, setFormError] = useState("");

  // Members modal state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("developer");
  const [memberError, setMemberError] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/projects");
      const raw = res.data.data?.projects || res.data.data || res.data || [];
      setProjects(Array.isArray(raw) ? raw : []);
    } catch {
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/auth/users");
      setAllUsers(res.data.data?.users || res.data.data || res.data || []);
    } catch {
      // endpoint may not exist — fallback to email input only
      setAllUsers([]);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError("Project name is required.");
    try {
      setSubmitting(true);
      setFormError("");
      await api.post("/projects", form);
      setForm({ name: "", description: "", status: "active" });
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      setDeleteConfirm(null);
      fetchProjects();
    } catch {
      setError("Failed to delete project.");
    }
  };

  const openMembersModal = (e, project) => {
    e.stopPropagation();
    setSelectedProject(project);
    setMemberEmail("");
    setMemberRole("developer");
    setMemberError("");
    setShowMembersModal(true);
    fetchUsers();
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return setMemberError("Email is required.");
    try {
      setAddingMember(true);
      setMemberError("");
      await api.post(`/projects/${selectedProject._id}/members`, {
        email: memberEmail.trim(),
        role: memberRole,
      });
      setMemberEmail("");
      setMemberError("");
      // Show success briefly
      setMemberError("✅ Member added successfully!");
      setTimeout(() => setMemberError(""), 2000);
    } catch (err) {
      setMemberError(err.response?.data?.message || "Failed to add member.");
    } finally {
      setAddingMember(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-zinc-400 text-sm mt-1">
              {projects.length} project{projects.length !== 1 ? "s" : ""} total
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </button>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-950 border border-red-800 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-zinc-800 rounded w-2/3 mb-3" />
                <div className="h-3 bg-zinc-800 rounded w-full mb-2" />
                <div className="h-3 bg-zinc-800 rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">No projects yet</h3>
            <p className="text-zinc-500 text-sm mb-6">Create your first project to start tracking bugs.</p>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project._id}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors group cursor-pointer"
                onClick={() => navigate(`/projects/${project._id}/bugs`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base truncate group-hover:text-red-400 transition-colors">
                      {project.name}
                    </h3>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[project.status] || statusColors.active}`}>
                      {project.status || "active"}
                    </span>
                  </div>

                  {/* Admin action buttons */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-all">
                      {/* Manage Members */}
                      <button
                        onClick={(e) => openMembersModal(e, project)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-950 transition-all"
                        title="Manage members"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project._id); }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-950 transition-all"
                        title="Delete project"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-zinc-400 text-sm line-clamp-2 mb-4 min-h-[2.5rem]">
                  {project.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <span className="text-zinc-500 text-xs">
                    {project.bugCount ?? 0} bug{(project.bugCount ?? 0) !== 1 ? "s" : ""}
                  </span>
                  <span className="text-zinc-500 text-xs">
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manage Members Modal */}
      {showMembersModal && selectedProject && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowMembersModal(false)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-white font-semibold text-lg">Manage Members</h2>
                <p className="text-zinc-500 text-xs mt-0.5">{selectedProject.name}</p>
              </div>
              <button onClick={() => setShowMembersModal(false)} className="text-zinc-500 hover:text-white transition">✕</button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">User Email</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600 transition"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">Role</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600 transition"
                >
                  <option value="developer">Developer</option>
                  <option value="tester">Tester</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {memberError && (
                <p className={`text-sm px-3 py-2 rounded-lg border ${
                  memberError.startsWith("✅")
                    ? "text-green-400 bg-green-950 border-green-800"
                    : "text-red-400 bg-red-950 border-red-800"
                }`}>
                  {memberError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowMembersModal(false)}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 rounded-lg text-sm transition"
                >
                  Done
                </button>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm transition"
                >
                  {addingMember ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">New Project</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {formError && (
                <p className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-3 py-2">{formError}</p>
              )}
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">Project Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. DebugX Backend"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this project about?"
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600 transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 rounded-lg text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  {submitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-red-950 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-base mb-1">Delete Project?</h3>
            <p className="text-zinc-400 text-sm mb-5">
              This will permanently delete the project and all its bugs. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 rounded-lg text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}