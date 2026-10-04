# Learnix

A full-stack online learning platform where instructors publish courses, admins review them, and students learn through video lessons, quizzes and certificates.

Built with the MERN stack (MongoDB, Express, React, Node.js).

---

## Features

**Students**
- Browse and search courses by category and level
- Enroll in free courses instantly or buy paid courses via UPI
- Watch video lessons with saved progress
- Take quizzes and earn a printable completion certificate
- Wishlist courses and leave reviews

**Instructors**
- Create courses with sections, lessons and quizzes
- Submit courses for admin approval before they go live

**Admins**
- Approve or reject submitted courses
- Verify student payments to unlock paid courses
- Manage users, roles and categories, with a stats dashboard

**General**
- JWT authentication with role-based access (student, instructor, admin)
- Password hashing with bcrypt
- Responsive UI built with Tailwind CSS

---

## Tech Stack

| Layer    | Technologies                                                 |
| -------- | ------------------------------------------------------------ |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Axios, Lucide    |
| Backend  | Node.js, Express, Mongoose, JWT, bcryptjs, Morgan, CORS      |
| Database | MongoDB                                                      |

---

## Project Structure

```
LearnSphere/
├── backend/
│   └── src/
│       ├── config/        # Database connection
│       ├── controllers/   # Request handlers
│       ├── middleware/    # Auth and error handling
│       ├── models/        # Mongoose schemas
│       ├── routes/        # API routes
│       ├── utils/         # Helpers (JWT, async handler)
│       ├── app.js         # Express app setup
│       └── server.js      # Entry point
└── frontend/
    └── src/
        ├── components/    # Reusable UI components
        ├── context/       # Auth context
        ├── layouts/       # Main and dashboard layouts
        ├── pages/         # Route pages
        ├── services/      # API service layer
        └── utils/         # Constants and helpers
```

---

## Getting Started

### Prerequisites
- Node.js 18 or higher
- MongoDB (local installation or MongoDB Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/Shruti123-coder1/Learnix.git
cd Learnix
```

### 2. Set up the backend
```bash
cd backend
npm install
```

Create a `.env` file in `backend/` using `.env.example` as a reference.

Start the server:
```bash
npm run dev
```
The API runs at `http://localhost:5000`. Default categories are created automatically on first start.

### 3. Set up the frontend
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` using `.env.example` as a reference.

Start the app:
```bash
npm run dev
```
The app runs at `http://localhost:5173`.

---

## How It Works

1. An **instructor** creates a course, adds sections, lessons and a quiz, then submits it for approval.
2. An **admin** reviews the course and approves it. It then appears on the home and explore pages.
3. A **student** enrolls. Free courses unlock immediately. For paid courses the student pays via UPI and submits the transaction ID.
4. The **admin** verifies the payment, which unlocks the course.
5. The student completes lessons, passes the quiz and downloads the certificate.

---

## API Overview

| Route               | Description                              | Access                  |
| ------------------- | ---------------------------------------- | ----------------------- |
| `/api/auth`         | Register, login, current user            | Public / Authenticated  |
| `/api/courses`      | Courses, sections and lessons            | Public / Instructor     |
| `/api/enrollments`  | Enrollment, progress, certificates       | Student                 |
| `/api/quizzes`      | Create, fetch and submit quizzes         | Instructor / Student    |
| `/api/payments`     | Submit and view payments                 | Student                 |
| `/api/reviews`      | Course reviews                           | Public / Student        |
| `/api/wishlist`     | Manage wishlist                          | Student                 |
| `/api/admin`        | Stats, users, approvals, payments        | Admin                   |

Health check: `GET /api/health`

---

## Scripts

| Location    | Command           | Purpose                    |
| ----------- | ----------------- | -------------------------- |
| `backend`   | `npm run dev`     | Start with auto-reload     |
| `backend`   | `npm start`       | Start in production mode   |
| `frontend`  | `npm run dev`     | Start the dev server       |
| `frontend`  | `npm run build`   | Create a production build  |
| `frontend`  | `npm run lint`    | Run ESLint                 |

---

## Future Improvements

- Automated payment gateway integration
- Course search suggestions and recommendations
- Email notifications for approvals and payments
- Instructor earnings dashboard

---

## Author

**Shruti Pailwan**
