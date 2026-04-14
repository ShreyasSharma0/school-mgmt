# 🎓 SchoolEase — School Management System

A full-stack web application to manage school operations: students, assignments, and admin authentication.

Built with **React + Vite** (frontend) and **Node.js + Express + MongoDB** (backend).

---

## ✨ Features

- **Admin Authentication** - Secure JWT-based login with bcrypt password hashing
- **Student Management** — Add, edit, soft-delete, and search students with class/section filters
- **Task/Assignment Management** — Assign tasks, set priorities and due dates, mark complete, auto-mark overdue
- **Dashboard** — Live stats on students, pending, completed, and overdue tasks
- **Security** — Rate limiting, Helmet headers, CORS, input validation, sanitisation

---

## 🛠 Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, React Router v6     |
| Backend   | Node.js, Express 4                  |
| Database  | MongoDB (Atlas recommended)         |
| Auth      | JWT + bcryptjs                      |
| Security  | Helmet, express-rate-limit, express-validator |
| Styling   | CSS Modules, custom design system   |

---

## 🚀 Local Development Setup

### Prerequisites

- **Node.js** v18+
- **MongoDB** — [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 

---

### 1. Clone the repository

```bash
git clone https://github.com/ShreyasSharma0/school-mgmt.git
cd school-mgmt
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/
DB_NAME=school_mgmt
JWT_SECRET=a_random_secret_at_least_32_characters_long
JWT_EXPIRES_IN=7d
SETUP_KEY=choose_a_secure_setup_key
ALLOWED_ORIGINS=http://localhost:5173
PORT=5000
NODE_ENV=development
```

Start the backend:

```bash
npm run dev      # development (nodemon)
# or
npm start        # production
```

The API will be available at `http://localhost:5000`.

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.


---

