import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";

const priorityColors = {
    low: "bg-green-900 text-green-400",
    medium: "bg-yellow-900 text-yellow-400",
    high: "bg-orange-900 text-orange-400",
    critical: "bg-red-900 text-red-400",
};

const statusColors = {
    open: "bg-blue-900 text-blue-400",
    in_progress: "bg-purple-900 text-purple-400",
    resolved: "bg-green-900 text-green-400",
    closed: "bg-zinc-800 text-zinc-400",
};

const statusLabels = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
};

export default function BugList() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [bugs, setBugs] = useState([]);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");

    const [form, setForm] = useState({
        title: "", description: "", priority: "medium", stepsToReproduce: "", expectedBehavior: "", actualBehavior: "",
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projRes, bugsRes] = await Promise.all([
                api.get(`/projects/${projectId}`),
                api.get(`/bugs/project/${projectId}`),
            ]);

            // Fix project extraction
            const projData = projRes.data.data || projRes.data;
            setProject(projData?.project || projData);

            // ✅ Actually set the bugs
            const bugsData = bugsRes.data.data || bugsRes.data;
            setBugs(Array.isArray(bugsData) ? bugsData : bugsData?.bugs || []);

        } catch (err) {
            setError("Failed to load bugs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [projectId]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return setFormError("Bug title is required.");
        if (form.title.trim().length < 5) return setFormError("Title must be at least 5 characters.");
        if (!form.description.trim()) return setFormError("Bug description is required.");
        if (form.description.trim().length < 10) return setFormError("Description must be at least 10 characters.");

        try {
            setSubmitting(true);
            setFormError("");
            await api.post("/bugs", {
                projectId: projectId,      // ✅ correct field name
                title: form.title.trim(),
                description: form.description.trim(),
                priority: form.priority,
                stepsToReproduce: form.stepsToReproduce,
            });
            setForm({ title: "", description: "", priority: "medium", stepsToReproduce: "", expectedBehavior: "", actualBehavior: "" });
            setShowModal(false);
            fetchData();
        } catch (err) {
            setFormError(err.response?.data?.message || "Failed to create bug.");
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = bugs.filter((b) => {
        const s = filterStatus === "all" || b.status === filterStatus;
        const p = filterPriority === "all" || b.priority === filterPriority;
        return s && p;
    });

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
                    <button onClick={() => navigate("/projects")} className="hover:text-white transition-colors">
                        Projects
                    </button>
                    <span>/</span>
                    <span className="text-white">{project?.name || "Loading..."}</span>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{project?.name || "Bugs"}</h1>
                        <p className="text-zinc-400 text-sm mt-1">
                            {filtered.length} bug{filtered.length !== 1 ? "s" : ""}
                            {filterStatus !== "all" || filterPriority !== "all" ? " (filtered)" : " total"}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Report Bug
                    </button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-red-600 transition-colors"
                    >
                        <option value="all">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>

                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-red-600 transition-colors"
                    >
                        <option value="all">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>

                    {(filterStatus !== "all" || filterPriority !== "all") && (
                        <button
                            onClick={() => { setFilterStatus("all"); setFilterPriority("all"); }}
                            className="text-xs text-zinc-400 hover:text-white px-3 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 transition-colors"
                        >
                            Clear filters
                        </button>
                    )}

                    {/* Stats pills */}
                    <div className="ml-auto flex items-center gap-2">
                        {["open", "in_progress", "resolved", "closed"].map((s) => {
                            const count = bugs.filter(b => b.status === s).length;
                            return count > 0 ? (
                                <span key={s} className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[s]}`}>
                                    {statusLabels[s]}: {count}
                                </span>
                            ) : null;
                        })}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 bg-red-950 border border-red-800 rounded-lg text-red-400 text-sm">{error}</div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 animate-pulse">
                                <div className="h-4 bg-zinc-800 rounded w-1/3 mb-3" />
                                <div className="h-3 bg-zinc-800 rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-1">No bugs found</h3>
                        <p className="text-zinc-500 text-sm mb-6">
                            {filterStatus !== "all" || filterPriority !== "all"
                                ? "Try clearing your filters."
                                : "Report the first bug for this project."}
                        </p>
                        {filterStatus === "all" && filterPriority === "all" && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Report Bug
                            </button>
                        )}
                    </div>
                ) : (
                    /* Bug list */
                    <div className="space-y-3">
                        {filtered.map((bug) => (
                            <div
                                key={bug._id}
                                onClick={() => navigate(`/projects/${projectId}/bugs/${bug._id}`)}
                                className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="text-white font-medium text-sm group-hover:text-red-400 transition-colors truncate">
                                                {bug.title}
                                            </h3>
                                            {/* AI badge */}
                                            {bug.aiClassification && (
                                                <span className="flex items-center gap-1 text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full font-medium shrink-0">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.344.346a3.51 3.51 0 01-1 2.395l-.34.34a2 2 0 01-1.42.588h-3.35a2 2 0 01-1.42-.588l-.34-.34a3.51 3.51 0 01-1-2.395l-.344-.346z" />
                                                    </svg>
                                                    AI
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-zinc-500 text-xs line-clamp-1">
                                            {bug.description || "No description provided."}
                                        </p>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[bug.priority] || priorityColors.medium}`}>
                                            {bug.priority || "medium"}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[bug.status] || statusColors.open}`}>
                                            {statusLabels[bug.status] || bug.status || "open"}
                                        </span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800">
                                    <span className="text-zinc-600 text-xs">
                                        #{bug._id?.slice(-6).toUpperCase()}
                                    </span>
                                    {bug.assignedTo && (
                                        <span className="text-zinc-500 text-xs flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            {bug.assignedTo?.name || bug.assignedTo}
                                        </span>
                                    )}
                                    <span className="text-zinc-600 text-xs ml-auto">
                                        {bug.createdAt
                                            ? new Date(bug.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                            : "—"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Bug Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-white font-semibold text-lg">Report a Bug</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors"
                            >
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
                                <label className="block text-zinc-400 text-sm mb-1.5">Bug Title *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g. Login button not responding"
                                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-sm mb-1.5">
                                    Description <span className="text-zinc-600">(min 10 characters)</span>
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Describe the bug in detail..."
                                    rows={3}
                                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-sm mb-1.5">Priority</label>
                                <select
                                    value={form.priority}
                                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600 transition-colors"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-sm mb-1.5">Steps to Reproduce</label>
                                <textarea
                                    value={form.stepsToReproduce}
                                    onChange={(e) => setForm({ ...form, stepsToReproduce: e.target.value })}
                                    placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                                    rows={3}
                                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-zinc-400 text-sm mb-1.5">Expected Behavior</label>
                                    <textarea
                                        value={form.expectedBehavior}
                                        onChange={(e) => setForm({ ...form, expectedBehavior: e.target.value })}
                                        placeholder="What should happen?"
                                        rows={2}
                                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-400 text-sm mb-1.5">Actual Behavior</label>
                                    <textarea
                                        value={form.actualBehavior}
                                        onChange={(e) => setForm({ ...form, actualBehavior: e.target.value })}
                                        placeholder="What actually happens?"
                                        rows={2}
                                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {submitting ? "Submitting..." : "Report Bug"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}