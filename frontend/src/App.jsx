import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import CourseDetails from "./pages/CourseDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

import MyLearning from "./pages/MyLearning";
import LessonPlayer from "./pages/LessonPlayer";
import Wishlist from "./pages/Wishlist";
import QuizPage from "./pages/QuizPage";
import Payment from "./pages/Payment";
import Certificate from "./pages/Certificate";

import InstructorDashboard from "./pages/InstructorDashboard";
import CourseManager from "./pages/CourseManager";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="explore" element={<Explore />} />
          <Route path="courses/:id" element={<CourseDetails />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          <Route element={<ProtectedRoute roles={["student"]} />}>
            <Route path="my-learning" element={<MyLearning />} />
            <Route path="learn/:courseId" element={<LessonPlayer />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="courses/:id/quiz" element={<QuizPage />} />
            <Route path="payments" element={<Payment />} />
            <Route path="payment/:courseId" element={<Payment />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Printable certificate (no navbar/footer) */}
        <Route element={<ProtectedRoute roles={["student"]} />}>
          <Route path="certificate/:courseId" element={<Certificate />} />
        </Route>

        {/* Instructor */}
        <Route element={<ProtectedRoute roles={["instructor"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="instructor" element={<InstructorDashboard />} />
            <Route path="instructor/courses/new" element={<CourseManager />} />
            <Route path="instructor/courses/:id" element={<CourseManager />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="admin" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}