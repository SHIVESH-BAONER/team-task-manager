import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const STATUSES = ['todo', 'in_progress', 'done'];
const STATUS_LABELS = { todo: '📋 Todo', in_progress: '🔄 In Progress', done: '✅ Done' };
const STATUS_COLORS = {
  todo: 'bg-gray-50 border-gray-200',
  in_progress: 'bg-yellow-50 border-yellow-200',
  done: 'bg-green-50 border-green-200',
};
const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [members, setMembers] = useState([]);

  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [showMemberForm, setShowMemberForm] = useState(false);

  const [activeTab, setActiveTab] = useState('board');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    try {
      const [projRes, tasksRes, statsRes, membersRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
        api.get(`/projects/${id}/dashboard`),
        api.get(`/projects/${id}/members`),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setStats(statsRes.data);
      setMembers(membersRes.data);
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [id]);

  const isAdmin = project?.role === 'admin';

  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...newTask, assigned_to: newTask.assigned_to || null };
      const res = await api.post(`/projects/${id}/tasks`, payload);
      setTasks([res.data, ...tasks]);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
      setShowTaskForm(false);
      // refresh stats
      api.get(`/projects/${id}/dashboard`).then(r => setStats(r.data));
    } catch (err) {
      alert(err.response?.data?.error || 'Could not create task');
    } finally {
      setSaving(false);
    }
  };

  const updateTaskStatus = async (task, status) => {
    try {
      const res = await api.put(`/tasks/${task.id}`, { ...task, status });
      setTasks(tasks.map(t => t.id === task.id ? res.data : t));
      api.get(`/projects/${id}/dashboard`).then(r => setStats(r.data));
    } catch {
      alert('Could not update task');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
      api.get(`/projects/${id}/dashboard`).then(r => setStats(r.data));
    } catch {
      alert('Could not delete task');
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      setMemberEmail('');
      setShowMemberForm(false);
      api.get(`/projects/${id}/members`).then(r => setMembers(r.data));
    } catch (err) {
      alert(err.response?.data?.error || 'Could not add member');
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setMembers(members.filter(m => m.id !== userId));
    } catch {
      alert('Could not remove member');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading project...</div>
      </div>
    );
  }

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <div>
            <h1 className="font-bold text-gray-800 text-lg leading-tight">{project?.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {isAdmin ? '👑 Admin' : '👤 Member'}
            </span>
          </div>
        </div>
      </nav>

      {/* Stats Bar */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto grid grid-cols-4 gap-4">
          {[
            { label: 'Todo', value: stats.todo, color: 'text-gray-700', bg: 'bg-gray-100' },
            { label: 'In Progress', value: stats.in_progress, color: 'text-yellow-700', bg: 'bg-yellow-100' },
            { label: 'Done', value: stats.done, color: 'text-green-700', bg: 'bg-green-100' },
            { label: 'Overdue', value: stats.overdue, color: 'text-red-700', bg: 'bg-red-100' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-lg p-3 text-center`}>
              <div className={`text-2xl font-bold ${color}`}>{value || 0}</div>
              <div className={`text-xs ${color} font-medium`}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="max-w-6xl mx-auto flex gap-6">
          {['board', 'members'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'board' ? '📋 Task Board' : '👥 Members'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">

        {/* ── TASK BOARD TAB ── */}
        {activeTab === 'board' && (
          <>
            {/* Add Task Button */}
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                + Add Task
              </button>
            </div>

            {/* Add Task Form */}
            {showTaskForm && (
              <div className="bg-white rounded-xl border shadow-sm p-5 mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">New Task</h3>
                <form onSubmit={createTask} className="space-y-3">
                  <input
                    required
                    placeholder="Task title *"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                      <select
                        value={newTask.priority}
                        onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                      <input
                        type="date"
                        value={newTask.due_date}
                        onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Assign To</label>
                      <select
                        value={newTask.assigned_to}
                        onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Unassigned</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? 'Adding...' : 'Add Task'}
                    </button>
                    <button type="button" onClick={() => setShowTaskForm(false)}
                      className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Kanban Board */}
            <div className="grid grid-cols-3 gap-4">
              {STATUSES.map(status => (
                <div key={status} className={`rounded-xl border-2 ${STATUS_COLORS[status]} p-4`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-700 text-sm">{STATUS_LABELS[status]}</h3>
                    <span className="bg-white text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full border">
                      {tasksByStatus(status).length}
                    </span>
                  </div>

                  <div className="space-y-3 min-h-20">
                    {tasksByStatus(status).map(task => (
                      <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-gray-800 text-sm leading-tight flex-1 pr-2">{task.title}</p>
                          {(isAdmin) && (
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="text-red-400 hover:text-red-600 text-xs shrink-0"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                            {task.priority}
                          </span>
                          {task.due_date && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              new Date(task.due_date) < new Date() && task.status !== 'done'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              📅 {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {task.assigned_name && (
                          <p className="text-xs text-gray-400 mb-2">👤 {task.assigned_name}</p>
                        )}

                        <select
                          value={task.status}
                          onChange={e => updateTaskStatus(task, e.target.value)}
                          className="w-full text-xs border rounded px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                          <option value="todo">📋 Todo</option>
                          <option value="in_progress">🔄 In Progress</option>
                          <option value="done">✅ Done</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── MEMBERS TAB ── */}
        {activeTab === 'members' && (
          <div className="max-w-2xl">
            {isAdmin && (
              <div className="bg-white rounded-xl border shadow-sm p-5 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-800">Add Member</h3>
                  <button
                    onClick={() => setShowMemberForm(!showMemberForm)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    {showMemberForm ? 'Cancel' : '+ Add'}
                  </button>
                </div>

                {showMemberForm && (
                  <form onSubmit={addMember} className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Member email"
                      value={memberEmail}
                      onChange={e => setMemberEmail(e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={memberRole}
                      onChange={e => setMemberRole(e.target.value)}
                      className="border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Add
                    </button>
                  </form>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl border shadow-sm divide-y">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-800">{member.name}</p>
                    <p className="text-sm text-gray-400">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      member.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {member.role === 'admin' ? '👑 Admin' : '👤 Member'}
                    </span>
                    {isAdmin && member.id !== user?.id && (
                      <button
                        onClick={() => removeMember(member.id)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
