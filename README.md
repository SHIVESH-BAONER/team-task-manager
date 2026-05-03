# 🚀 Team Task Manager

A full-stack project management web app with role-based access control.

## 🌐 Live Demo
> Add your Railway URL here after deployment

## ✨ Features
- **Authentication** — Signup & Login with JWT
- **Projects** — Create projects, invite team members
- **Role-Based Access** — Admin (full control) vs Member (update tasks)
- **Task Board** — Kanban-style board with Todo / In Progress / Done columns
- **Task Details** — Title, description, priority, due date, assignment
- **Dashboard Stats** — Todo, In Progress, Done, Overdue counts
- **Overdue Detection** — Tasks past due date are highlighted in red

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| Deployment | Railway |

## 📁 Project Structure

```
team-task-manager/
├── backend/         ← Express API server
│   ├── src/
│   │   ├── config/      ← Database connection
│   │   ├── controllers/ ← Auth, Projects, Tasks logic
│   │   ├── middleware/  ← JWT auth, role check
│   │   ├── routes/      ← API route definitions
│   │   └── app.js       ← Entry point
│   └── schema.sql   ← Database tables
└── frontend/        ← React app
    └── src/
        ├── api/         ← Axios instance
        ├── context/     ← Auth context
        └── pages/       ← Login, Signup, Dashboard, ProjectPage
```

## 🚀 Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/team-task-manager.git
cd team-task-manager
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your DATABASE_URL and JWT_SECRET in .env
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

### 4. Create Database Tables
Run the SQL in `backend/schema.sql` in your PostgreSQL instance.

## 🌐 API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /api/auth/signup | ❌ | - | Register |
| POST | /api/auth/login | ❌ | - | Login |
| GET | /api/auth/me | ✅ | Any | Current user |
| GET | /api/projects | ✅ | Any | List my projects |
| POST | /api/projects | ✅ | Any | Create project |
| GET | /api/projects/:id | ✅ | Member | Get project |
| GET | /api/projects/:id/members | ✅ | Member | List members |
| POST | /api/projects/:id/members | ✅ | Admin | Add member |
| DELETE | /api/projects/:id/members/:uid | ✅ | Admin | Remove member |
| GET | /api/projects/:id/tasks | ✅ | Member | List tasks |
| POST | /api/projects/:id/tasks | ✅ | Member | Create task |
| PUT | /api/tasks/:id | ✅ | Member | Update task |
| DELETE | /api/tasks/:id | ✅ | Admin | Delete task |
| GET | /api/projects/:id/dashboard | ✅ | Member | Stats |

## 🚂 Railway Deployment

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project
3. Add **PostgreSQL** service → copy DATABASE_URL
4. Add **Backend** service → GitHub repo → root: `backend`
   - Env vars: `DATABASE_URL`, `JWT_SECRET`, `PORT=5000`
5. Add **Frontend** service → GitHub repo → root: `frontend`
   - Build: `npm run build` | Start: `npx serve dist`
   - Env: `VITE_API_URL=https://your-backend.railway.app/api`
6. Run `schema.sql` in Railway's PostgreSQL query tab
