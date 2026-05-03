const db = require('../config/db');

// POST /api/projects/:projectId/tasks
exports.createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, assigned_to, due_date, priority } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required.' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO tasks (project_id, title, description, assigned_to, due_date, priority, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        projectId,
        title.trim(),
        description || '',
        assigned_to || null,
        due_date || null,
        priority || 'medium',
        req.user.id
      ]
    );

    // Get assigned user name
    const task = rows[0];
    if (task.assigned_to) {
      const user = await db.query('SELECT name FROM users WHERE id = $1', [task.assigned_to]);
      task.assigned_name = user.rows[0]?.name || null;
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Could not create task.' });
  }
};

// GET /api/projects/:projectId/tasks
exports.getTasks = async (req, res) => {
  const { projectId } = req.params;
  const { status, priority } = req.query;

  let query = `
    SELECT t.*, 
      u.name AS assigned_name,
      c.name AS created_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.project_id = $1
  `;
  const params = [projectId];

  if (status) {
    params.push(status);
    query += ` AND t.status = $${params.length}`;
  }

  if (priority) {
    params.push(priority);
    query += ` AND t.priority = $${params.length}`;
  }

  query += ' ORDER BY t.created_at DESC';

  try {
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch tasks.' });
  }
};

// PUT /api/tasks/:taskId
exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { title, description, status, priority, assigned_to, due_date } = req.body;

  const validStatuses = ['todo', 'in_progress', 'done'];
  const validPriorities = ['low', 'medium', 'high'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority value.' });
  }

  try {
    const { rows } = await db.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           assigned_to = $5,
           due_date = $6
       WHERE id = $7
       RETURNING *`,
      [title, description, status, priority, assigned_to || null, due_date || null, taskId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Get assigned user name
    const task = rows[0];
    if (task.assigned_to) {
      const user = await db.query('SELECT name FROM users WHERE id = $1', [task.assigned_to]);
      task.assigned_name = user.rows[0]?.name || null;
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Could not update task.' });
  }
};

// DELETE /api/tasks/:taskId
exports.deleteTask = async (req, res) => {
  const { taskId } = req.params;
  try {
    await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete task.' });
  }
};

// GET /api/projects/:projectId/dashboard
exports.getDashboard = async (req, res) => {
  const { projectId } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'todo') AS todo,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'done') AS done,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'done') AS overdue,
        COUNT(*) AS total
       FROM tasks
       WHERE project_id = $1`,
      [projectId]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch dashboard data.' });
  }
};
