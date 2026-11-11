# Excellup Coaching Management System

A complete MERN Stack Coaching Institute Management System for **Excellup Coding Classes, Balaghat, Madhya Pradesh**.

## Features

- 🎓 Three role-based dashboards: Admin, Teacher, Student
- 👥 Complete student and teacher management
- 📅 Attendance tracking with calendar view and reports
- 📚 Study material uploads (PDF, DOC, PPT, images, video links)
- 📝 Online MCQ examination system with timer and auto-submit
- 📊 Analytics and reporting with chart visualizations
- 🔐 Secure JWT-based authentication with role-based access control
- 📱 Fully responsive design for desktop, tablet, and mobile
- ☁️ Cloudinary file storage
- 📧 Email notifications

## Tech Stack

**Frontend:** React.js (Vite) + Tailwind CSS + Recharts + React Hook Form  
**Backend:** Node.js + Express.js + MongoDB (Mongoose) + JWT

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account (for file uploads)

## Setup Instructions

### 1. Clone / Download the project

```bash
cd "excellup dashhbord"
```

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run seed   # Seed initial data
npm run dev    # Start backend (port 5000)
```

### 3. Frontend Setup

```bash
cd client
npm install
# Create .env file:
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm run dev    # Start frontend (port 5173)
```

## Default Credentials (after seeding)

| Role    | Email                   | Password    |
|---------|-------------------------|-------------|
| Admin   | admin@excellup.com      | Admin@123   |
| Teacher | teacher1@excellup.com   | Teacher@123 |
| Teacher | teacher2@excellup.com   | Teacher@123 |
| Student | student1@excellup.com   | Student@123 |

Students can also login with their **Student ID** (e.g., `EXC-2024-001`)

## Project Structure

```
excellup dashhbord/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth context
│   │   ├── layouts/        # Admin, Teacher, Student layouts
│   │   ├── pages/          # All page components
│   │   │   ├── admin/
│   │   │   ├── teacher/
│   │   │   ├── student/
│   │   │   └── auth/
│   │   ├── routes/         # Protected route guards
│   │   └── services/       # API service functions
│   └── package.json
│
└── server/                 # Express + MongoDB backend
    ├── config/             # DB and Cloudinary config
    ├── controllers/        # Request handlers
    ├── middleware/         # Auth, error handling, upload
    ├── models/             # Mongoose models
    ├── routes/             # API routes
    ├── utils/              # Helpers and seed script
    └── server.js
```

## API Documentation

Base URL: `http://localhost:5000/api`

### Auth
- `POST /auth/login` — Login
- `POST /auth/logout` — Logout
- `GET /auth/me` — Get current user
- `POST /auth/forgot-password` — Send reset email
- `PUT /auth/reset-password/:token` — Reset password
- `PUT /auth/change-password` — Change password

### Students
- `GET /students` — List all students (admin)
- `POST /students` — Create student (admin)
- `GET /students/:id` — Get student details
- `PUT /students/:id` — Update student
- `DELETE /students/:id` — Delete student

### Attendance
- `POST /attendance/mark` — Mark attendance (teacher/admin)
- `GET /attendance/batch` — Get batch attendance by date
- `GET /attendance/student` — Get student attendance calendar
- `GET /attendance/report` — Attendance report

### MCQ Tests
- `POST /tests` — Create test
- `POST /questions/test/:testId` — Add question
- `POST /test-attempts/start/:testId` — Start test attempt
- `PATCH /test-attempts/:id/save` — Auto-save answers
- `POST /test-attempts/:id/submit` — Submit test
- `GET /test-attempts/:id/result` — Get result

## Security

- JWT tokens with expiry
- bcrypt password hashing
- Role-based access control on all routes
- Helmet security headers
- CORS configured
- Rate limiting on auth endpoints
- Input validation with express-validator
- Correct answers never sent to frontend before submission
- Server-side mark calculation

## Color Palette

- Primary Purple: `#7C3AED`
- Background: `#F8FAFC`
- Dark Text: `#111827`
- Success: `#10B981`
- Danger: `#EF4444`
- Warning: `#F59E0B`

