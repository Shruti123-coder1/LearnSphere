# Learnix

A full-stack online learning platform where instructors publish courses, admins review them, and students learn through video lessons, quizzes and certificates.

## Features

- **Students:** browse courses, enroll for free or pay via UPI, watch lessons with saved progress, take quizzes, earn a certificate, wishlist and review courses
- **Instructors:** create courses with sections, lessons and quizzes, then submit for admin approval
- **Admins:** approve courses, verify payments, manage users and categories
- **Security:** JWT authentication, role-based access, bcrypt password hashing

## Tech Stack

| Layer    | Technologies                                    |
| -------- | ----------------------------------------------- |
| Frontend | React, Vite, Tailwind CSS, React Router, Axios  |
| Backend  | Node.js, Express, Mongoose, JWT                 |
| Database | MongoDB                                         |

## Getting Started

**Prerequisites:** Node.js 18+ and MongoDB

```bash
git clone https://github.com/Shruti123-coder1/Learnix.git
cd Learnix
```

**Backend** (runs on `http://localhost:5000`)
```bash
cd backend
npm install
npm run dev
```

**Frontend** (runs on `http://localhost:5173`)
```bash
cd frontend
npm install
npm run dev
```

Create a `.env` file in both `backend/` and `frontend/` using their `.env.example` files.

## Author

**Shruti Pailwan**
