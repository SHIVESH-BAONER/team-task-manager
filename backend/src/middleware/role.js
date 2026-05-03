const db = require('../config/db');

module.exports = async (req, res, next) => {
  const { projectId } = req.params;

  try {
    const { rows } = await db.query(
      'SELECT role FROM project_members WHERE project_id=$1 AND user_id=$2',
      [projectId, req.user.id]
    );

    if (!rows.length) {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    if (rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required for this action.' });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error checking role.' });
  }
};
