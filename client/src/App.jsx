import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Core layout components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Route protection guards
import ProtectedRoute from './routes/ProtectedRoute';
import RoleBasedRoute from './routes/RoleBasedRoute';

// Page imports
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ExplorePage from './pages/ExplorePage';
import GroundDetailsPage from './pages/GroundDetailsPage';
import ProfilePage from './pages/ProfilePage';
import ContactUs from './pages/ContactUs';
import Tournaments from './pages/Tournaments';
import DeploymentStatusPage from './pages/DeploymentStatusPage';

// Dashboards
import UserDashboard from './pages/user/UserDashboard';
import MyBookings from './pages/user/MyBookings';

import OwnerDashboard from './pages/owner/OwnerDashboard';
import MyGrounds from './pages/owner/MyGrounds';
import AddGround from './pages/owner/AddGround';
import TimeSlotManagement from './pages/owner/TimeSlotManagement';
import CreateTournament from './pages/owner/CreateTournament';

import AdminDashboard from './pages/admin/AdminDashboard';
import GroundVerification from './pages/admin/GroundVerification';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
          
          {/* Global Header */}
          <Navbar />
          
          {/* Main Layout Area */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
            <Routes>
              
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Main Routes */}
              <Route path="/" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
              <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
              <Route path="/grounds/:id" element={<ProtectedRoute><GroundDetailsPage /></ProtectedRoute>} />
              <Route path="/contact" element={<ProtectedRoute><ContactUs /></ProtectedRoute>} />
              <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
              <Route path="/deployment-status" element={<ProtectedRoute><DeploymentStatusPage /></ProtectedRoute>} />
              
              {/* User Dashboard Protected Routes */}
              <Route path="/user/dashboard" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['user']}>
                    <UserDashboard />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/user/bookings" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['user']}>
                    <MyBookings />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              {/* Shared Protected Profile Route */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />

              {/* Owner Dashboard Protected Routes */}
              <Route path="/owner/dashboard" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['owner']}>
                    <OwnerDashboard />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/owner/grounds" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['owner']}>
                    <MyGrounds />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/owner/add-ground" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['owner']}>
                    <AddGround />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/owner/slots" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['owner']}>
                    <TimeSlotManagement />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/owner/tournaments/new" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['owner']}>
                    <CreateTournament />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              {/* Admin Dashboard Protected Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/admin/verify" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <GroundVerification />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </main>

          {/* Global Footer */}
          <Footer />

          {/* Toast Notification Container */}
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: '#0f172a',
                color: '#fff',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                fontSize: '13px'
              }
            }}
          />

        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
