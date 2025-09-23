import { Outlet } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Header from './Header';
import Footer from './Footer';

const MainLayout = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-sticky bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg border-2 border-blue-600 dark:border-blue-400 font-medium"
      >
        Skip to main content
      </a>

      {/* Fixed Header */}
      <Header />

      {/* Main Content Area */}
      <main
        className="flex-1 relative"
        id="main-content"
        role="main"
        aria-label="Main content"
      >
        {/* Background Effects */}
        <div className="fixed inset-0 -z-10" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full filter blur-3xl animate-pulse" />
        </div>

        {/* Content Container */}
        <div className="relative z-0 container mx-auto px-4 pb-8" style={{ paddingTop: '88px' }}>
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;