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
  open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed",
};

export default function BugDetail() {
  const { bugId } = useParams();
  const navigate = useNavigate();

  const [bug, setBug] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const fetchBug = async () => {
    try {
      setLoading(true);
      const [bugRes, commentsRes] = await Promise.all([
        api.get(`/bugs/${bugId}`),
        api.get(`/bugs/${bugId}/comments`),
      ]);
      setBug(bugRes.data.data.bug);
      const raw = commentsRes.data.data.comments || [];
      setComments(Array.isArray(raw) ? raw : []);
    } catch {
      setError("Failed to load bug details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBug(); }, [bugId]);

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await api.patch(`/bugs/${bugId}/status`, { status: newStatus });
      setBug((prev) => ({ ...prev, status: newStatus }));
    } catch {
      setError("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setPosting(true);
      await api.post(`/bugs/${bugId}/comments`, { content: newComment });
      setNewComment("");
      fetchBug();
    } catch {
      setError("Failed to post comment.");
    } finally {
      setPosting(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-zinc-800 rounded w-1/3 mb-3" />
            <div className="h-3 bg-zinc-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    </Layout>
  );

  if (error || !bug) return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="p-4 bg-red-950 border border-red-800 rounded-xl text-red-400 text-sm">{error || "Bug not found."}</div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <button onClick={() => navigate("/projects")} className="hover:text-white transition-colors">Projects</button>
          <span>/</span>
          <button onClick={() => navigate(`/projects/${bug?.project?._id}/bugs`)} className="hover:text-white transition-colors">
            {bug.project?.name || "Bugs"}
          </button>
          <span>/</span>
          <span className="text-white truncate max-w-xs">{bug.title}</span>
        </div>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-xl font-bold text-white">{bug.title}</h1>
              {bug.aiClassified && (
                <span className="flex items-center gap-1 text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded-full font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.344.346a3.51 3.51 0 01-1 2.395l-.34.34a2 2 0 01-1.42.588h-3.35a2 2 0 01-1.42-.588l-.34-.34a3.51 3.51 0 01-1-2.395l-.344-.346z" />
                  </svg>
                  AI Classified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[bug.priority] || priorityColors.medium}`}>
                {bug.priority || "medium"}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[bug.status] || statusColors.open}`}>
                {statusLabels[bug.status] || bug.status}
              </span>
              <span className="text-zinc-600 text-xs font-mono">#{bugId?.slice(-6).toUpperCase()}</span>
            </div>
          </div>

          {/* Status updater */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-zinc-500 text-sm">Status:</span>
            <select
              value={bug.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-600 transition-colors disabled:opacity-50"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-zinc-800">
          {["details", "comments", "ai"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === tab
                  ? "border-red-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
            >
              {tab === "ai" ? "AI Analysis" : tab}
              {tab === "comments" && comments.length > 0 && (
                <span className="ml-1.5 text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">
                  {comments.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* DETAILS TAB */}
        {activeTab === "details" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Main content */}
            <div className="col-span-2 space-y-5">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">Description</h3>
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {bug.description || "No description provided."}
                </p>
              </div>

              {bug.stepsToReproduce && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">Steps to Reproduce</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{bug.stepsToReproduce}</p>
                </div>
              )}

              {(bug.expectedBehavior || bug.actualBehavior) && (
                <div className="grid grid-cols-2 gap-4">
                  {bug.expectedBehavior && (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                      <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">Expected</h3>
                      <p className="text-zinc-300 text-sm leading-relaxed">{bug.expectedBehavior}</p>
                    </div>
                  )}
                  {bug.actualBehavior && (
                    <div className="bg-zinc-950 border border-red-900 rounded-xl p-4">
                      <h3 className="text-red-400 text-xs font-medium uppercase tracking-wider mb-2">Actual</h3>
                      <p className="text-zinc-300 text-sm leading-relaxed">{bug.actualBehavior}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar meta */}
            <div className="space-y-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
                <MetaRow label="Reported by" value={bug.reportedBy?.name || bug.reportedBy || "—"} />
                <MetaRow label="Assigned to" value={bug.assignedTo?.name || bug.assignedTo || "Unassigned"} />
                <MetaRow label="Priority" value={bug.priority || "medium"} />
                <MetaRow label="Created" value={bug.createdAt ? new Date(bug.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"} />
                <MetaRow label="Updated" value={bug.updatedAt ? new Date(bug.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"} />
              </div>
            </div>
          </div>
        )}

        {/* COMMENTS TAB */}
        {activeTab === "comments" && (
          <div className="space-y-4 max-w-3xl">
            {comments.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">No comments yet. Be the first to comment.</div>
            ) : (
              comments.map((c, i) => (
                <div key={c._id || i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-red-900 flex items-center justify-center text-xs font-medium text-red-300">
                        {(c.author?.name || c.author || "U")[0].toUpperCase()}
                      </div>
                      <span className="text-white text-sm font-medium">{c.author?.name || c.author || "User"}</span>
                    </div>
                    <span className="text-zinc-600 text-xs">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed pl-9">{c.content || c.text}</p>
                </div>
              ))
            )}

            {/* Add comment */}
            <form onSubmit={handleComment} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors resize-none mb-3"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={posting || !newComment.trim()}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {posting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* AI ANALYSIS TAB */}
        {activeTab === "ai" && (
          <div className="max-w-3xl space-y-4">
            {!bug.aiClassified ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-white font-semibold mb-1">Not Yet Classified</h3>
                <p className="text-zinc-500 text-sm">AI service will classify this bug shortly after creation.</p>
              </div>
            ) : (
              <>
                {/* AI Classification Card */}
                <div className="bg-zinc-950 border border-red-900/50 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🤖</span>
                    <h3 className="text-red-400 text-xs font-medium uppercase tracking-wider">
                      AI Classification
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <AIRow label="Category" value={bug.category?.replace('_', ' ')} />
                    <AIRow label="Priority" value={bug.priority} />
                    <AIRow label="Severity" value={bug.severity} />
                    <AIRow
                      label="Confidence"
                      value={`${Math.round((bug.aiConfidence || 0) * 100)}%`}
                    />
                  </div>

                  {/* Confidence Bar */}
                  <div className="mt-5 pt-4 border-t border-zinc-800">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-zinc-500">Confidence Score</span>
                      <span className="text-white font-medium">
                        {Math.round((bug.aiConfidence || 0) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.round((bug.aiConfidence || 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Info Note */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    This bug was automatically classified by DebugX AI using
                    TF-IDF vectorization and Naive Bayes classification.
                    The confidence score indicates how certain the model is about
                    this classification.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-zinc-500 text-xs">{label}</span>
      <span className="text-zinc-300 text-xs text-right">{value}</span>
    </div>
  );
}

function AIRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-zinc-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium capitalize">{value}</span>
    </div>
  );
}