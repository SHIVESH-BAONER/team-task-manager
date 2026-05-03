const db = require('../config/db');

// POST /api/projects
exports.createProject = async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required.' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), description || '', req.user.id]
    );

    // Creator automatically becomes admin
    await client.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [rows[0].id, req.user.id, 'admin']
    );

    await client.query('COMMIT');
    res.status(201).json({ ...rows[0], role: 'admin' });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Could not create project.' });
  } finally {
    client.release();
  }
};

// GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, pm.role,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch projects.' });
  }
};

// GET /api/projects/:projectId
exports.getProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT p.*, pm.role FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE p.id = $1 AND pm.user_id = $2`,
      [projectId, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Project not found or access denied.' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch project.' });
  }
};

// POST /api/projects/:projectId/members
exports.addMember = async (req, res) => {
  const { projectId } = req.params;
  const { email, role = 'member' } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or member.' });
  }

  try {
    const userResult = await db.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'No user found with that email.' });
    }

    const userId = userResult.rows[0].id;

    await db.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3`,
      [projectId, userId, role]
    );

    res.json({
      message: 'Member added successfully.',
      member: { ...userResult.rows[0], role }
    });

  } catch (err) {
    res.status(500).json({ error: 'Could not add member.' });
  }
};

// GET /api/projects/:projectId/members
exports.getMembers = async (req, res) => {
  const { projectId } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, pm.role, pm.created_at AS joined_at
       FROM users u
       JOIN project_members pm ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.role DESC, u.name ASC`,
      [projectId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch members.' });
  }
};

// DELETE /api/projects/:projectId/members/:userId
exports.removeMember = async (req, res) => {
  const { projectId, userId } = req.params;
  try {
    await db.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    res.json({ message: 'Member removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not remove member.' });
  }
};

// DELETE /api/projects/:projectId
exports.deleteProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    await db.query('DELETE FROM projects WHERE id = $1 AND owner_id = $2', [projectId, req.user.id]);
    res.json({ message: 'Project deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete project.' });
  }
};
