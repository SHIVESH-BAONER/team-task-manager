import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects')
      .then(r => setProjects(r.data))
      .finally(() => setLoading(false));
  }, []);

  const createProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/projects', newProject);
      setProjects([res.data, ...projects]);
      setNewProject({ name: '', description: '' });
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <span className="font-bold text-xl text-gray-800">TaskManager</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">👋 {user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
            <p className="text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            + New Project
          </button>
        </div>

        {/* Create Project Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Create New Project</h2>
            <form onSubmit={createProject} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Project name *"
                value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newProject.description}
                onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-gray-500 text-lg">No projects yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-white rounded-xl shadow-sm border p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-800 text-lg leading-tight">{project.name}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    project.role === 'admin'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {project.role === 'admin' ? '👑 Admin' : '👤 Member'}
                  </span>
                </div>
                {project.description && (
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{project.description}</p>
                )}
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>📋 {project.task_count || 0} tasks</span>
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
