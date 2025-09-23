import { Link } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';
import { supabase } from '../../lib/supabase';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Get logo URL from Supabase storage
  const { data: logoUrlData } = supabase.storage
    .from('images')
    .getPublicUrl('5Ccompany_logo_sm.webp');
  const logoUrl = logoUrlData?.publicUrl;

  const footerLinks = {
    company: [
      { label: 'About Us', path: '/about' },
      { label: 'Careers', path: '/careers' },
      { label: 'Press', path: '/press' },
      { label: 'Blog', path: '/blog' },
    ],
    support: [
      { label: 'Help Center', path: '/help' },
      { label: 'Safety', path: '/safety' },
      { label: 'Contact Us', path: '/contact' },
      { label: 'FAQ', path: '/faq' },
    ],
    legal: [
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Cookie Policy', path: '/cookies' },
      { label: 'Licenses', path: '/licenses' },
    ],
    community: [
      { label: 'Community Guidelines', path: '/guidelines' },
      { label: 'Vendor Resources', path: '/vendor-resources' },
      { label: 'Developer API', path: '/api' },
      { label: 'Partners', path: '/partners' },
    ],
  };

  const socialLinks = [
    { 
      name: 'Facebook', 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      url: 'https://facebook.com' 
    },
    { 
      name: 'Twitter', 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      url: 'https://twitter.com' 
    },
    { 
      name: 'Instagram', 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
        </svg>
      ),
      url: 'https://instagram.com' 
    },
    { 
      name: 'LinkedIn', 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      url: 'https://linkedin.com' 
    },
  ];

  return (
    <footer
      className="relative mt-20"
      role="contentinfo"
      aria-label="Site footer"
    >
      <GlassCard className="border-t border-glass" blur="md">
        <div className="container mx-auto px-4 py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center space-x-2 mb-4">
                {logoUrl ? (
                  <>
                    <img
                      src={logoUrl}
                      alt="TRVL"
                      className="h-8 w-auto object-contain"
                    />
                    <span className="text-lg font-light">Social</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      TRVL
                    </span>
                    <span className="text-lg font-light">Social</span>
                  </>
                )}
              </Link>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Connecting adventurers with unforgettable experiences around the world.
              </p>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <p className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href="tel:+19172421333" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    +1 (917) 242-1333
                  </a>
                </p>
              </div>
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-glass-light transition-colors"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Links Sections */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                {footerLinks.support.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2">
                {footerLinks.community.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Subscription */}
          <div className="border-t border-glass pt-8 mb-8">
            <div className="max-w-md mx-auto text-center">
              <h3 className="font-semibold mb-2">Stay Updated</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Get the latest adventures and community updates delivered to your inbox.
              </p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Age Verification Notice */}
          <div className="border-t border-glass pt-6 pb-4">
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              <p className="mb-2">
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs font-medium mr-2">
                  13+
                </span>
                TRVL Social is for users 13 years and older. We comply with COPPA.
              </p>
              <p>
                Questions about age verification? Contact{' '}
                <a
                  href="mailto:privacy@trvlsocial.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  privacy@trvlsocial.com
                </a>
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-glass pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <p>&copy; {currentYear} TRVL Social. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                English (US)
              </button>
              <span>•</span>
              <button className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                USD ($)
              </button>
              <span>•</span>
              <Link to="/accessibility" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </GlassCard>
    </footer>
  );
};

export default Footer;