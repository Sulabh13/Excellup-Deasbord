import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentsPage from './pages/admin/StudentsPage';
import TeachersPage from './pages/admin/TeachersPage';
import CoursesPage from './pages/admin/CoursesPage';
import SubjectsPage from './pages/admin/SubjectsPage';
import BatchesPage from './pages/admin/BatchesPage';
import AttendancePage from './pages/admin/AttendancePage';
import MaterialsPage from './pages/admin/MaterialsPage';
import TestsPage from './pages/admin/TestsPage';
import AdminCreateTestPage from './pages/admin/CreateTestPage';
import QuestionsPage from './pages/admin/QuestionsPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import ReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherAttendancePage from './pages/teacher/TeacherAttendancePage';
import UploadNotesPage from './pages/teacher/UploadNotesPage';
import CreateTestPage from './pages/teacher/CreateTestPage';
import ManageTestsPage from './pages/teacher/ManageTestsPage';
import StudentResultsPage from './pages/teacher/StudentResultsPage';
import StudentListPage from './pages/teacher/StudentListPage';
import TeacherProfilePage from './pages/teacher/TeacherProfilePage';
import TeacherAnnouncementsPage from './pages/teacher/TeacherAnnouncementsPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendancePage from './pages/student/StudentAttendancePage';
import StudyNotesPage from './pages/student/StudyNotesPage';
import OnlineTestsPage from './pages/student/OnlineTestsPage';
import TestInstructionsPage from './pages/student/TestInstructionsPage';
import TestAttemptPage from './pages/student/TestAttemptPage';
import TestResultPage from './pages/student/TestResultPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentBatchPage from './pages/student/StudentBatchPage';
import StudentAnnouncementsPage from './pages/student/AnnouncementsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#7C3AED', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="batches" element={<BatchesPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="tests" element={<TestsPage />} />
            <Route path="tests/create" element={<AdminCreateTestPage />} />
            <Route path="tests/:testId/questions" element={<QuestionsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Teacher Routes */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherDashboard />} />
            <Route path="batches" element={<StudentListPage />} />
            <Route path="students" element={<StudentListPage />} />
            <Route path="attendance" element={<TeacherAttendancePage />} />
            <Route path="notes/upload" element={<UploadNotesPage />} />
            <Route path="materials" element={<UploadNotesPage />} />
            <Route path="tests/create" element={<CreateTestPage />} />
            <Route path="tests" element={<ManageTestsPage />} />
            <Route path="tests/:testId/questions" element={<QuestionsPage />} />
            <Route path="results" element={<StudentResultsPage />} />
            <Route path="announcements" element={<TeacherAnnouncementsPage />} />
            <Route path="profile" element={<TeacherProfilePage />} />
          </Route>

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfilePage />} />
            <Route path="batch" element={<StudentBatchPage />} />
            <Route path="attendance" element={<StudentAttendancePage />} />
            <Route path="notes" element={<StudyNotesPage />} />
            <Route path="tests" element={<OnlineTestsPage />} />
            <Route path="tests/:testId/instructions" element={<TestInstructionsPage />} />
            <Route path="tests/:testId/attempt" element={<TestAttemptPage />} />
            <Route path="results/:attemptId" element={<TestResultPage />} />
            <Route path="announcements" element={<StudentAnnouncementsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
