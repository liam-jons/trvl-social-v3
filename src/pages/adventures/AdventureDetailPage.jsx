import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { mockAdventures } from '../../data/mock-adventures';
import GlassCard from '../../components/ui/GlassCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ImageGallery from '../../components/adventure/ImageGallery';
import VendorProfile from '../../components/adventure/VendorProfile';
import PricingBreakdown from '../../components/adventure/PricingBreakdown';
import AvailabilityCalendar from '../../components/adventure/AvailabilityCalendar';
import SocialProof from '../../components/adventure/SocialProof';
import SimilarAdventures from '../../components/adventure/SimilarAdventures';
import FavoriteButton from '../../components/wishlist/FavoriteButton';

const AdventureDetailPage = () => {
  const { id } = useParams();
  const [adventure, setAdventure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const loadAdventure = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const foundAdventure = mockAdventures.find(adv => adv.id === parseInt(id));
      setAdventure(foundAdventure);
      setLoading(false);
    };

    if (id) {
      loadAdventure();
    }
  }, [id]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!adventure) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Adventure Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The adventure you're looking for doesn't exist.</p>
          <Link
            to="/adventures"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            Browse All Adventures
          </Link>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'availability', label: 'Availability' },
    { id: 'reviews', label: 'Reviews' }
  ];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400">Home</Link>
          <span>/</span>
          <Link to="/adventures" className="hover:text-primary-600 dark:hover:text-primary-400">Adventures</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{adventure.title}</span>
        </nav>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative"
      >
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Image Gallery */}
            <div className="order-2 lg:order-1">
              <ImageGallery images={adventure.images || [adventure.image]} />
            </div>

            {/* Adventure Info */}
            <div className="order-1 lg:order-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {adventure.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full capitalize"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                  {adventure.title}
                </h1>

                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{adventure.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{adventure.duration}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {renderStars(adventure.rating)}
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {adventure.rating}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    ({adventure.reviewCount} reviews)
                  </span>
                </div>

                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {adventure.longDescription || adventure.description}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${adventure.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      per person
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FavoriteButton
                      adventureId={adventure.id}
                      size="lg"
                      variant="solid"
                    />
                    <button className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors">
                      Book Now
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="sticky z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700" style={{ top: '88px' }}>
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === section.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {activeSection === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Description */}
                <GlassCard variant="light">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About This Adventure</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    {adventure.longDescription || adventure.description}
                  </p>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Duration</h3>
                      <p className="text-gray-600 dark:text-gray-300">{adventure.duration}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Group Size</h3>
                      <p className="text-gray-600 dark:text-gray-300">{adventure.groupSize}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Difficulty</h3>
                      <p className="text-gray-600 dark:text-gray-300 capitalize">{adventure.difficulty}</p>
                    </div>
                  </div>
                </GlassCard>

                {/* What's Included */}
                {adventure.included && (
                  <GlassCard variant="light">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">What's Included</h3>
                    <ul className="space-y-2">
                      {adventure.included.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                )}

                {/* Requirements */}
                {adventure.requirements && (
                  <GlassCard variant="light">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Requirements</h3>
                    <ul className="space-y-2">
                      {adventure.requirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                )}
              </motion.div>
            )}

            {activeSection === 'itinerary' && adventure.itinerary && (
              <motion.div
                key="itinerary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <GlassCard variant="light">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Daily Itinerary</h2>
                  <div className="space-y-6">
                    {adventure.itinerary.map((day) => (
                      <div key={day.day} className="border-l-2 border-primary-200 dark:border-primary-800 pl-6 relative">
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-primary-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Day {day.day}: {day.title}
                        </h3>
                        <ul className="space-y-1 mb-3">
                          {day.activities.map((activity, index) => (
                            <li key={index} className="text-gray-600 dark:text-gray-300 text-sm">
                              • {activity}
                            </li>
                          ))}
                        </ul>
                        {day.accommodation && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            <strong>Accommodation:</strong> {day.accommodation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {activeSection === 'pricing' && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <PricingBreakdown adventure={adventure} />
              </motion.div>
            )}

            {activeSection === 'availability' && (
              <motion.div
                key="availability"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AvailabilityCalendar adventure={adventure} />
              </motion.div>
            )}

            {activeSection === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <SocialProof adventure={adventure} />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <VendorProfile vendor={adventure.vendor} />

            {/* Similar Adventures */}
            <SimilarAdventures
              currentAdventure={adventure}
              adventures={mockAdventures.filter(adv => adv.id !== adventure.id).slice(0, 3)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventureDetailPage;
