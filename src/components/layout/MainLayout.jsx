import { Outlet } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Header from './Header';
import Footer from './Footer';

const MainLayout = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      {/* Fixed Header */}
      <Header />
      
      {/* Main Content Area */}
      <main className="flex-1 relative">
        {/* Background Effects */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full filter blur-3xl animate-pulse" />
        </div>
        
        {/* Content Container */}
        <div className="relative z-0 container mx-auto px-4 pt-20 pb-8">
          <Outlet />
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;