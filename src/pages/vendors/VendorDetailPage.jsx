import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CheckBadgeIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  UserIcon,
  CameraIcon,
  CalendarIcon,
  HeartIcon,
  ShareIcon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import GlassCard from '../../components/ui/GlassCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { mockVendors } from '../../data/mock-vendors';
import { mockAdventures } from '../../data/mock-adventures';

const VendorDetailPage = () => {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [vendorAdventures, setVendorAdventures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const loadVendorData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Find vendor by ID
        const foundVendor = mockVendors.find(v => v.id === id);
        if (!foundVendor) {
          setError('Vendor not found');
          return;
        }

        setVendor(foundVendor);

        // Get vendor's adventures (filter by vendor ID from mockAdventures)
        const adventures = mockAdventures.filter(adventure =>
          adventure.vendor && adventure.vendor.id === id
        );
        setVendorAdventures(adventures);

      } catch (err) {
        setError('Failed to load vendor information');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadVendorData();
    }
  }, [id]);

  const handleContactVendor = () => {
    // This would typically open a contact modal or redirect to contact page
    alert('Contact functionality would be implemented here');
  };

  const handleBookAdventure = (adventure) => {
    window.location.href = `/adventures/${adventure.id}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: vendor.name,
        text: vendor.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center">
        <LoadingSpinner message="Loading vendor information..." />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center">
        <GlassCard variant="light" className="text-center max-w-md">
          <ExclamationTriangleIcon className="mx-auto w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Vendor Not Found'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The vendor you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => window.location.href = '/vendors'}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Browse All Vendors
          </button>
        </GlassCard>
      </div>
    );
  }

  const AdventureCard = ({ adventure }) => (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <GlassCard
        variant="light"
        className="cursor-pointer transition-all duration-300 hover:shadow-xl"
        onClick={() => handleBookAdventure(adventure)}
      >
        <div className="relative h-48 -m-6 mb-4 rounded-t-xl overflow-hidden">
          <img
            src={adventure.image}
            alt={adventure.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <div className="absolute bottom-4 left-4 text-white">
            <span className="px-2 py-1 bg-black/50 rounded-full text-sm font-medium">
              ${adventure.price}
            </span>
          </div>

          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 bg-white/90 text-xs font-medium text-gray-700 rounded-full">
              {adventure.duration}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
            {adventure.title}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {adventure.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(adventure.rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {adventure.rating}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({adventure.reviewCount})
              </span>
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <UserIcon className="w-4 h-4" />
              {adventure.groupSize}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBookAdventure(adventure);
            }}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            View Adventure
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <GlassCard variant="light" className="overflow-hidden">
            {/* Cover Image */}
            <div className="relative h-64 md:h-80 -m-6 mb-6">
              <img
                src={vendor.coverImage}
                alt={vendor.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Vendor Info Overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-end gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={vendor.avatar}
                      alt={vendor.name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                    {vendor.verified && (
                      <CheckBadgeIcon className="absolute -top-1 -right-1 w-6 h-6 text-blue-500 bg-white rounded-full" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-white">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                      {vendor.name}
                    </h1>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        {vendor.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {vendor.responseTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        Since {vendor.establishedYear}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleShare}
                      className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                    >
                      <ShareIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors">
                      <HeartIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIconSolid
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(vendor.rating)
                            ? 'text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {vendor.rating}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {vendor.reviewCount} reviews
                </p>
              </div>

              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {vendor.adventureCount}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Adventures
                </p>
              </div>

              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {vendor.stats.totalBookings}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Bookings
                </p>
              </div>

              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {vendor.stats.yearsInBusiness}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Years in Business
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleContactVendor}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
                Contact Vendor
              </button>
              <button className="px-6 py-3 bg-white/50 dark:bg-black/20 hover:bg-white/70 dark:hover:bg-black/30 border border-white/20 dark:border-white/10 rounded-lg font-medium transition-colors">
                View All Adventures
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard variant="light">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-white/30 dark:bg-black/20 p-1 rounded-lg">
              {[
                { id: 'about', label: 'About' },
                { id: 'adventures', label: 'Adventures' },
                { id: 'gallery', label: 'Gallery' },
                { id: 'reviews', label: 'Reviews' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-black/20'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      About {vendor.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {vendor.aboutLong}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Specializations
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {vendor.adventureTypes.map((type, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Languages
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {vendor.languages.map((lang, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Certifications & Badges
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Certifications
                        </h4>
                        <ul className="space-y-1">
                          {vendor.certifications.map((cert, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                            >
                              <CheckBadgeIcon className="w-4 h-4 text-green-500" />
                              {cert}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Badges
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {vendor.badges.map((badge, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-full text-sm"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Contact Information
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3">
                        <PhoneIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {vendor.contactPhone}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {vendor.contactEmail}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {vendor.website}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'adventures' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Adventures ({vendorAdventures.length})
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Price range: {vendor.priceRange}
                    </p>
                  </div>

                  {vendorAdventures.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {vendorAdventures.map((adventure) => (
                        <AdventureCard key={adventure.id} adventure={adventure} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CameraIcon className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No adventures available
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        This vendor hasn't listed any adventures yet.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'gallery' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Photo Gallery
                  </h2>

                  <div className="space-y-6">
                    {/* Main Selected Image */}
                    <div className="relative h-96 rounded-xl overflow-hidden">
                      <img
                        src={vendor.gallery[selectedImage]}
                        alt={`${vendor.name} gallery ${selectedImage + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Thumbnail Grid */}
                    <div className="grid grid-cols-6 gap-2">
                      {vendor.gallery.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`relative h-20 rounded-lg overflow-hidden transition-all ${
                            selectedImage === index
                              ? 'ring-2 ring-blue-500 scale-95'
                              : 'hover:scale-95'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${vendor.name} gallery thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Reviews & Ratings
                  </h2>

                  <div className="text-center py-12">
                    <StarIcon className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Reviews coming soon
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Detailed reviews and ratings system will be implemented here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorDetailPage;
