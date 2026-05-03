const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const adminOnly = require('../middleware/role');

const authCtrl = require('../controllers/auth');
const projectCtrl = require('../controllers/projects');
const taskCtrl = require('../controllers/tasks');

// ─── AUTH ROUTES (no login needed) ───────────────────────────────────────────
router.post('/auth/signup', authCtrl.signup);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authMiddleware, authCtrl.getMe);

// ─── PROJECT ROUTES ───────────────────────────────────────────────────────────
router.get('/projects', authMiddleware, projectCtrl.getProjects);
router.post('/projects', authMiddleware, projectCtrl.createProject);
router.get('/projects/:projectId', authMiddleware, projectCtrl.getProject);
router.delete('/projects/:projectId', authMiddleware, adminOnly, projectCtrl.deleteProject);

// ─── MEMBER ROUTES ────────────────────────────────────────────────────────────
router.get('/projects/:projectId/members', authMiddleware, projectCtrl.getMembers);
router.post('/projects/:projectId/members', authMiddleware, adminOnly, projectCtrl.addMember);
router.delete('/projects/:projectId/members/:userId', authMiddleware, adminOnly, projectCtrl.removeMember);

// ─── TASK ROUTES ──────────────────────────────────────────────────────────────
router.get('/projects/:projectId/tasks', authMiddleware, taskCtrl.getTasks);
router.post('/projects/:projectId/tasks', authMiddleware, taskCtrl.createTask);
router.put('/tasks/:taskId', authMiddleware, taskCtrl.updateTask);
router.delete('/tasks/:taskId', authMiddleware, taskCtrl.deleteTask);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
router.get('/projects/:projectId/dashboard', authMiddleware, taskCtrl.getDashboard);

module.exports = router;
