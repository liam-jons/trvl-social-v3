import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdventureGrid from '../adventure/AdventureGrid';
import GlassButton from '../ui/GlassButton';
import { mockAdventures } from '../../data/mock-adventures';

const HomepageAdventuresGrid = () => {
  const [adventures, setAdventures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedAdventures = async () => {
      setLoading(true);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Get featured adventures first, then fill with highest rated ones
      const featured = mockAdventures.filter(adventure => adventure.featured);
      const nonFeatured = mockAdventures
        .filter(adventure => !adventure.featured)
        .sort((a, b) => b.rating - a.rating);

      // Take 6 adventures total (featured first, then by rating)
      const selectedAdventures = [...featured, ...nonFeatured].slice(0, 6);

      setAdventures(selectedAdventures);
      setLoading(false);
    };

    loadFeaturedAdventures();
  }, []);

  const handleAdventureClick = (adventure) => {
    // Navigate to adventure detail page
    window.location.href = `/adventures/${adventure.id}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.section
      className="space-y-6 sm:space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Section Header */}
      <motion.div
        variants={itemVariants}
        className="text-center space-y-4"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
          Featured Adventures
        </h2>
        <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed px-4">
          Discover extraordinary experiences crafted by expert adventurers around the world
        </p>
      </motion.div>

      {/* Adventures Grid */}
      <motion.div variants={itemVariants}>
        <AdventureGrid
          adventures={adventures}
          viewMode="grid"
          onAdventureClick={handleAdventureClick}
          loading={loading}
          className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        />
      </motion.div>

      {/* View All Adventures Button */}
      <motion.div
        variants={itemVariants}
        className="text-center pt-8"
      >
        <Link to="/adventures">
          <GlassButton variant="primary" size="lg">
            View All Adventures
          </GlassButton>
        </Link>
      </motion.div>
    </motion.section>
  );
};

export default HomepageAdventuresGrid;