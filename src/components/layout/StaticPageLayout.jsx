import { Link } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const StaticPageLayout = ({
  title,
  description,
  children,
  breadcrumbs = [],
  showCTA = false,
  ctaTitle = "Ready to Start Your Adventure?",
  ctaDescription = "Join thousands of travelers discovering amazing experiences.",
  ctaLink = "/register",
  ctaText = "Get Started"
}) => {
  return (
    <div className="space-y-12">
      {/* Header Section */}
      <section className="text-center">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="mb-6">
            <ol className="flex items-center justify-center space-x-2 text-sm">
              <li>
                <Link to="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                  Home
                </Link>
              </li>
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <span className="text-gray-400">/</span>
                  {crumb.link ? (
                    <Link
                      to={crumb.link}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      {crumb.title}
                    </Link>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-300">
                      {crumb.title}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Title and Description */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {description}
          </p>
        )}
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto">
        <GlassCard className="prose prose-lg dark:prose-invert max-w-none">
          {children}
        </GlassCard>
      </section>

      {/* Call to Action */}
      {showCTA && (
        <section className="max-w-2xl mx-auto">
          <GlassCard className="text-center p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {ctaTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {ctaDescription}
            </p>
            <Link to={ctaLink}>
              <GlassButton variant="primary" size="lg">
                {ctaText}
              </GlassButton>
            </Link>
          </GlassCard>
        </section>
      )}
    </div>
  );
};

export default StaticPageLayout;