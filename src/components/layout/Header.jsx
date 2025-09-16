import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import NotificationDropdown from '../notifications/NotificationDropdown';
import useNotificationStore from '../../stores/notificationStore';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { unreadCount, initialize } = useNotificationStore();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotificationDropdownOpen(false);
  }, [location]);

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initialize();
    }
  }, [isAuthenticated, initialize]);

  const navItems = [
    { path: '/search', label: 'Search', icon: '🔍' },
    { path: '/adventures', label: 'Adventures', icon: '🏔️' },
    { path: '/trips/request', label: 'Plan Trip', icon: '✈️' },
    { path: '/wishlist', label: 'Wishlist', icon: '❤️', requiresAuth: true },
    { path: '/community', label: 'Community', icon: '👥' },
    { path: '/connections', label: 'Connections', icon: '🤝', requiresAuth: true },
    { path: '/groups', label: 'Groups', icon: '👥' },
    { path: '/vendors', label: 'Vendors', icon: '🏪' },
    { path: '/offers', label: 'Offers', icon: '💼', requiresAuth: true },
    { path: '/compatibility-demo', label: 'Compatibility', icon: '🧩' },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
    setIsNotificationDropdownOpen(false);
  };

  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
  };

  const closeNotificationDropdown = () => {
    setIsNotificationDropdownOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'py-2' : 'py-4'
      }`}
    >
      <GlassCard
        className={`container mx-auto px-4 ${
          isScrolled ? 'glass-blur-lg' : 'glass-blur-md'
        } border-b border-glass`}
        blur="lg"
      >
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TRVL
            </span>
            <span className="text-xl font-light">Social</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              // Skip auth-required items if user is not authenticated
              if (item.requiresAuth && !isAuthenticated) return null;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      isActive
                        ? 'bg-glass-heavy text-blue-600 dark:text-blue-400'
                        : 'hover:bg-glass-light'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-glass-light transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={toggleNotificationDropdown}
                    className="relative p-2 rounded-lg hover:bg-glass-light transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <NotificationDropdown
                    isOpen={isNotificationDropdownOpen}
                    onToggle={toggleNotificationDropdown}
                    onClose={closeNotificationDropdown}
                  />
                </div>

                {/* Profile Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-glass-light transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <GlassCard className="py-2">
                      <Link to="/profile" className="block px-4 py-2 hover:bg-glass-light transition-colors">
                        Profile
                      </Link>
                      <Link to="/settings" className="block px-4 py-2 hover:bg-glass-light transition-colors">
                        Settings
                      </Link>
                      <hr className="my-2 border-glass" />
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 hover:bg-glass-light transition-colors text-red-600 dark:text-red-400"
                      >
                        Sign Out
                      </button>
                    </GlassCard>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <GlassButton variant="ghost" size="sm">
                    Sign In
                  </GlassButton>
                </Link>
                <Link to="/register">
                  <GlassButton variant="primary" size="sm">
                    Get Started
                  </GlassButton>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-glass-light transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-96 mt-4' : 'max-h-0'
          }`}
        >
          <nav className="space-y-2 pb-4">
            {navItems.map((item) => {
              // Skip auth-required items if user is not authenticated
              if (item.requiresAuth && !isAuthenticated) return null;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-glass-heavy text-blue-600 dark:text-blue-400'
                        : 'hover:bg-glass-light'
                    }`
                  }
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </NavLink>
              );
            })}
            
            <hr className="my-2 border-glass" />
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="block px-4 py-2 rounded-lg hover:bg-glass-light transition-colors"
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 rounded-lg hover:bg-glass-light transition-colors"
                >
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-glass-light transition-colors text-red-600 dark:text-red-400"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <Link to="/login" className="block">
                  <GlassButton variant="ghost" className="w-full">
                    Sign In
                  </GlassButton>
                </Link>
                <Link to="/register" className="block">
                  <GlassButton variant="primary" className="w-full">
                    Get Started
                  </GlassButton>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </GlassCard>
    </header>
  );
};

export default Header;