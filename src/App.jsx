import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { ABTestingProvider } from './hooks/useABTesting';
import { useAuth } from './hooks/useAuth';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import CookieConsentBanner from './components/common/CookieConsentBanner';

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
const RecommendationsPage = lazy(() => import('./pages/groups/recommendations/RecommendationsPage'));
const VendorsPage = lazy(() => import('./pages/vendors/VendorsPage'));
const VendorDetailPage = lazy(() => import('./pages/vendors/VendorDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PersonalityQuizPage = lazy(() => import('./pages/quiz/PersonalityQuizPage'));
const QuizResultsPage = lazy(() => import('./pages/quiz/QuizResultsPage'));
const QuizHistoryPage = lazy(() => import('./pages/quiz/QuizHistoryPage'));
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const SharedWishlistPage = lazy(() => import('./pages/SharedWishlistPage'));
const TripRequestPage = lazy(() => import('./pages/trips/TripRequestPage'));
const VendorDashboardPage = lazy(() => import('./pages/vendor/VendorDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const ABTestingDashboard = lazy(() => import('./components/admin/ABTestingDashboard'));
const ComplianceDashboard = lazy(() => import('./components/admin/ComplianceDashboard'));
const PrivacyPreferenceCenter = lazy(() => import('./components/settings/PrivacyPreferenceCenter'));
const BookingChatDemo = lazy(() => import('./components/booking/BookingChatDemo'));
const ConnectionsPage = lazy(() => import('./pages/ConnectionsPage'));
const OfferManagementPage = lazy(() => import('./pages/OfferManagementPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const CompatibilityDemoPage = lazy(() => import('./pages/CompatibilityDemoPage'));
const PayoutManagementPage = lazy(() => import('./pages/vendor/PayoutManagementPage'));
const BidRequestsPage = lazy(() => import('./pages/vendor/BidRequestsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Footer Pages - Company
const AboutPage = lazy(() => import('./pages/company/AboutPage'));
const CareersPage = lazy(() => import('./pages/company/CareersPage'));
const PressPage = lazy(() => import('./pages/company/PressPage'));
const BlogPage = lazy(() => import('./pages/company/BlogPage'));

// Footer Pages - Support
const HelpPage = lazy(() => import('./pages/support/HelpPage'));
const SafetyPage = lazy(() => import('./pages/support/SafetyPage'));
const ContactPage = lazy(() => import('./pages/support/ContactPage'));
const FAQPage = lazy(() => import('./pages/support/FAQPage'));

// Footer Pages - Legal
const TermsPage = lazy(() => import('./pages/legal/TermsPage'));
const LicensesPage = lazy(() => import('./pages/legal/LicensesPage'));
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage'));
const CookiePage = lazy(() => import('./pages/legal/CookiePage'));

// Footer Pages - Community
const GuidelinesPage = lazy(() => import('./pages/community/GuidelinesPage'));
const VendorResourcesPage = lazy(() => import('./pages/community/VendorResourcesPage'));
const APIPage = lazy(() => import('./pages/community/APIPage'));
const PartnersPage = lazy(() => import('./pages/community/PartnersPage'));
const AccessibilityPage = lazy(() => import('./pages/community/AccessibilityPage'));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <AnalyticsProvider>
            <ABTestingProvider>
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

                  {/* Onboarding Route */}
                  <Route path="onboarding" element={<OnboardingPage />} />

                  {/* Search Route */}
                  <Route path="search" element={<SearchPage />} />

                  {/* Wishlist Routes */}
                  <Route path="wishlist">
                    <Route index element={<WishlistPage />} />
                    <Route path="shared/:shareId" element={<SharedWishlistPage />} />
                  </Route>

                  {/* Adventures Routes */}
                  <Route path="adventures">
                    <Route index element={<AdventuresPage />} />
                    <Route path=":id" element={<AdventureDetailPage />} />
                  </Route>

                  {/* Community Routes */}
                  <Route path="community" element={<CommunityPage />} />

                  {/* Quiz Routes */}
                  <Route path="quiz">
                    <Route index element={<PersonalityQuizPage />} />
                    <Route path="results" element={<QuizResultsPage />} />
                    <Route path="history" element={<QuizHistoryPage />} />
                  </Route>

                  {/* Groups Routes */}
                  <Route path="groups">
                    <Route index element={<GroupsPage />} />
                    <Route path="recommendations" element={<RecommendationsPage />} />
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
                    <Route path="connections" element={<ConnectionsPage />} />
                    <Route path="offers" element={<OfferManagementPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                  </Route>

                  {/* Trip Routes */}
                  <Route path="trips">
                    <Route path="request" element={<TripRequestPage />} />
                  </Route>

                  {/* Demo Pages */}
                  <Route path="booking-chat" element={<BookingChatDemo />} />
                  <Route path="compatibility-demo" element={<CompatibilityDemoPage />} />

                  {/* Admin Routes */}
                  <Route element={<ProtectedRoute requireAuth={true} requiredRole="admin" />}>
                    <Route path="admin" element={<AdminDashboardPage />} />
                    <Route path="admin/ab-testing" element={<ABTestingDashboard />} />
                    <Route path="admin/*" element={<AdminDashboardPage />} />
                  </Route>

                  {/* Vendor Portal Routes */}
                  <Route element={<ProtectedRoute requireAuth={true} requiredRole={["vendor", "admin"]} />}>
                    <Route path="vendor-portal" element={<VendorDashboardPage />} />
                    <Route path="vendor-portal/*" element={<VendorDashboardPage />} />
                    <Route path="vendor/payouts" element={<PayoutManagementPage />} />
                    <Route path="vendor/bids" element={<BidRequestsPage />} />
                  </Route>

                  {/* Footer Pages - Company */}
                  <Route path="about" element={<AboutPage />} />
                  <Route path="careers" element={<CareersPage />} />
                  <Route path="press" element={<PressPage />} />
                  <Route path="blog" element={<BlogPage />} />

                  {/* Footer Pages - Support */}
                  <Route path="help" element={<HelpPage />} />
                  <Route path="safety" element={<SafetyPage />} />
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="faq" element={<FAQPage />} />

                  {/* Footer Pages - Legal */}
                  <Route path="terms" element={<TermsPage />} />
                  <Route path="licenses" element={<LicensesPage />} />
                  <Route path="privacy" element={<PrivacyPage />} />
                  <Route path="cookies" element={<CookiePage />} />

                  {/* Footer Pages - Community */}
                  <Route path="guidelines" element={<GuidelinesPage />} />
                  <Route path="vendor-resources" element={<VendorResourcesPage />} />
                  <Route path="api" element={<APIPage />} />
                  <Route path="partners" element={<PartnersPage />} />
                  <Route path="accessibility" element={<AccessibilityPage />} />

                  {/* 404 Page */}
                  <Route path="404" element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Route>
              </Routes>
            </Suspense>
                <CookieConsentBanner />
              </Router>
            </ABTestingProvider>
          </AnalyticsProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;