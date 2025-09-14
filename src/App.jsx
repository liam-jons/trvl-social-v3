import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuth } from './hooks/useAuth';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy load route components for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdventuresPage = lazy(() => import('./pages/adventures/AdventuresPage'));
const AdventureDetailPage = lazy(() => import('./pages/adventures/AdventureDetailPage'));
const CommunityPage = lazy(() => import('./pages/community/CommunityPage'));
const GroupsPage = lazy(() => import('./pages/groups/GroupsPage'));
const GroupDetailPage = lazy(() => import('./pages/groups/GroupDetailPage'));
const VendorsPage = lazy(() => import('./pages/vendors/VendorsPage'));
const VendorDetailPage = lazy(() => import('./pages/vendors/VendorDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PersonalityQuizPage = lazy(() => import('./pages/quiz/PersonalityQuizPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <Router>
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <Routes>
                {/* Main Layout Routes */}
                <Route path="/" element={<MainLayout />}>
                  {/* Public Routes */}
                  <Route index element={<HomePage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="auth/reset-password" element={<ResetPasswordPage />} />

                  {/* Adventures Routes */}
                  <Route path="adventures">
                    <Route index element={<AdventuresPage />} />
                    <Route path=":id" element={<AdventureDetailPage />} />
                  </Route>

                  {/* Community Routes */}
                  <Route path="community" element={<CommunityPage />} />

                  {/* Quiz Routes */}
                  <Route path="quiz" element={<PersonalityQuizPage />} />

                  {/* Groups Routes */}
                  <Route path="groups">
                    <Route index element={<GroupsPage />} />
                    <Route path=":id" element={<GroupDetailPage />} />
                  </Route>

                  {/* Vendors Routes */}
                  <Route path="vendors">
                    <Route index element={<VendorsPage />} />
                    <Route path=":id" element={<VendorDetailPage />} />
                  </Route>

                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute requireAuth={true} />}>
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route element={<ProtectedRoute requireAuth={true} requiredRole="admin" />}>
                    <Route path="admin/*" element={<div>Admin Panel (Coming Soon)</div>} />
                  </Route>

                  {/* Vendor Portal Routes */}
                  <Route element={<ProtectedRoute requireAuth={true} requiredRole={["vendor", "admin"]} />}>
                    <Route path="vendor-portal/*" element={<div>Vendor Portal (Coming Soon)</div>} />
                  </Route>

                  {/* 404 Page */}
                  <Route path="404" element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;