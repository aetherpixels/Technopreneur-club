import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/common/PrivateRoute';
import DashboardLayout from './layouts/DashboardLayout';
import HomeRedirect from './components/common/HomeRedirect';

// Auth views
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Common pages
import Profile from './pages/common/Profile';
import CompletedEvents from './pages/common/CompletedEvents';
import MediaGallery from './pages/common/MediaGallery';

// Admin views
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageFaculty from './pages/admin/ManageFaculty';
import ManageStudents from './pages/admin/ManageStudents';
import ManageAdmins from './pages/admin/ManageAdmins';
import AddStudent from './pages/admin/AddStudent';
import AddFaculty from './pages/admin/AddFaculty';
import AddAdmin from './pages/admin/AddAdmin';
import UserProfileEditor from './pages/admin/UserProfileEditor';

// Faculty views
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FestivalDashboard from './pages/faculty/FestivalDashboard';
import CreateEvent from './pages/faculty/CreateEvent';
import ManageEvents from './pages/faculty/ManageEvents';
import Attendance from './pages/faculty/Attendance';
import DocumentLibrary from './pages/faculty/DocumentLibrary';
import DocumentUpload from './pages/faculty/DocumentUpload';
import ManageMedia from './pages/faculty/ManageMedia';
import CertificateSetup from './pages/faculty/CertificateSetup';
import CertificateSetupList from './pages/faculty/CertificateSetupList';
import AttendanceList from './pages/faculty/AttendanceList';
import ViewRegistrations from './pages/faculty/ViewRegistrations';

// Student views
import StudentDashboard from './pages/student/StudentDashboard';
import UpcomingEvents from './pages/student/UpcomingEvents';
import RegisteredEvents from './pages/student/RegisteredEvents';
import CertificatesMedia from './pages/student/CertificatesMedia';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Authenticated Dashboard Core */}
          <Route path="/" element={<DashboardLayout />}>
            {/* Dynamic Dashboard Redirect */}
            <Route index element={<HomeRedirect />} />

            {/* Shared Public Media Gallery */}
            <Route 
              path="media" 
              element={
                <PrivateRoute allowedRoles={['Student', 'Faculty', 'Admin']}>
                  <MediaGallery />
                </PrivateRoute>
              } 
            />

            {/* Faculty & Admin Media Management */}
            <Route 
              path="faculty/manage-media" 
              element={
                <PrivateRoute allowedRoles={['Faculty', 'Admin']}>
                  <ManageMedia />
                </PrivateRoute>
              } 
            />

            {/* Admin Routes */}
            <Route 
              path="admin" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="admin/faculty" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <ManageFaculty />
                </PrivateRoute>
              } 
            />
            <Route 
              path="admin/students" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <ManageStudents />
                </PrivateRoute>
              } 
            />
            <Route 
              path="admin/admins" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <ManageAdmins />
                </PrivateRoute>
              } 
            />
            <Route 
              path="admin/add-student" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AddStudent />
                </PrivateRoute>
              } 
            />
            <Route 
              path="admin/add-faculty" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AddFaculty />
                </PrivateRoute>
              } 
            />
            <Route 
              path="admin/add-admin" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <AddAdmin />
                </PrivateRoute>
              } 
            />
            <Route 
              path="admin/user/:id" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <UserProfileEditor />
                </PrivateRoute>
              } 
            />
            <Route 
              path="admin/profile" 
              element={
                <PrivateRoute allowedRoles={['Admin']}>
                  <Profile />
                </PrivateRoute>
              } 
            />

            {/* Faculty Routes */}
            <Route 
              path="faculty" 
              element={
                <PrivateRoute allowedRoles={['Faculty']}>
                  <FacultyDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="faculty/create-event" 
              element={
                <PrivateRoute allowedRoles={['Faculty']}>
                  <CreateEvent />
                </PrivateRoute>
              } 
            />
            <Route 
              path="faculty/festival/:id" 
              element={
                <PrivateRoute allowedRoles={['Faculty']}>
                  <FestivalDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="faculty/manage-events" 
              element={
                <PrivateRoute allowedRoles={['Faculty']}>
                  <ManageEvents />
                </PrivateRoute>
              } 
            />
            <Route 
              path="faculty/registrations/:eventId" 
              element={
                <PrivateRoute allowedRoles={['Faculty']}>
                  <ViewRegistrations />
                </PrivateRoute>
              } 
            />
            <Route 
              path="faculty/certificate-setup" 
              element={
                <PrivateRoute allowedRoles={['Faculty', 'Admin']}>
                  <CertificateSetupList />
                </PrivateRoute>
              } 
            />
            <Route 
              path="faculty/certificate-setup/:eventId" 
              element={
                <PrivateRoute allowedRoles={['Faculty', 'Admin']}>
                  <CertificateSetup />
                </PrivateRoute>
              } 
            />
            <Route 
              path="faculty/attendance" 
              element={
                <PrivateRoute allowedRoles={['Faculty']}>
                  <AttendanceList />
                </PrivateRoute>
              } 
            />
            <Route 
              path="faculty/attendance/:eventId" 
              element={
                <PrivateRoute allowedRoles={['Faculty']}>
                  <Attendance />
                </PrivateRoute>
              } 
            />
            <Route 
              path="faculty/completed" 
              element={
                <PrivateRoute allowedRoles={['Faculty']}>
                  <CompletedEvents />
                </PrivateRoute>
              } 
            />
            <Route 
              path="faculty/documents" 
              element={
                <PrivateRoute allowedRoles={['Faculty', 'Admin']}>
                  <DocumentLibrary />
                </PrivateRoute>
              } 
            />
            <Route 
              path="faculty/upload" 
              element={
                <PrivateRoute allowedRoles={['Faculty', 'Admin']}>
                  <DocumentUpload />
                </PrivateRoute>
              } 
            />
            <Route 
              path="faculty/profile" 
              element={
                <PrivateRoute allowedRoles={['Faculty']}>
                  <Profile />
                </PrivateRoute>
              } 
            />

            {/* Student Routes */}
            <Route 
              path="student" 
              element={
                <PrivateRoute allowedRoles={['Student']}>
                  <StudentDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="student/upcoming" 
              element={
                <PrivateRoute allowedRoles={['Student']}>
                  <UpcomingEvents />
                </PrivateRoute>
              } 
            />
            <Route 
              path="student/registered" 
              element={
                <PrivateRoute allowedRoles={['Student']}>
                  <RegisteredEvents />
                </PrivateRoute>
              } 
            />
            <Route 
              path="student/completed" 
              element={
                <PrivateRoute allowedRoles={['Student']}>
                  <CompletedEvents />
                </PrivateRoute>
              } 
            />
            <Route 
              path="student/certificates" 
              element={
                <PrivateRoute allowedRoles={['Student']}>
                  <CertificatesMedia />
                </PrivateRoute>
              } 
            />
            <Route 
              path="student/profile" 
              element={
                <PrivateRoute allowedRoles={['Student']}>
                  <Profile />
                </PrivateRoute>
              } 
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  </ThemeProvider>
);
}

export default App;
