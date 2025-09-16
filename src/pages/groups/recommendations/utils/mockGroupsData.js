/**
 * Mock Groups Data for Testing Group Recommendation Engine
 * Generates realistic group and member data for development and testing
 */

export const generateMockGroups = (count = 20) => {
  const groups = [];

  for (let i = 1; i <= count; i++) {
    groups.push(generateMockGroup(i));
  }

  return groups;
};

const generateMockGroup = (id) => {
  const destinations = [
    'Tokyo, Japan', 'Paris, France', 'Costa Rica', 'New Zealand', 'Thailand',
    'Iceland', 'Morocco', 'Nepal', 'Peru', 'Vietnam', 'Norway', 'Egypt',
    'Kenya', 'Jordan', 'Croatia', 'Indonesia', 'Chile', 'Turkey', 'India', 'Portugal'
  ];

  const adventureTypes = [
    'cultural-immersion', 'adventure-sports', 'wellness-retreat', 'luxury-travel',
    'budget-backpacking', 'photography-tour', 'wildlife-safari', 'culinary-journey',
    'spiritual-retreat', 'extreme-sports'
  ];

  const activities = [
    'hiking', 'scuba-diving', 'rock-climbing', 'photography', 'cooking-classes',
    'temple-visits', 'wildlife-viewing', 'city-tours', 'beach-relaxation',
    'mountain-trekking', 'cultural-workshops', 'nightlife', 'museums',
    'adventure-sports', 'meditation', 'spa-treatments', 'local-cuisine',
    'historical-sites', 'art-galleries', 'music-festivals'
  ];

  const adventureType = adventureTypes[Math.floor(Math.random() * adventureTypes.length)];
  const destination = destinations[Math.floor(Math.random() * destinations.length)];

  // Generate group activities based on adventure type
  const groupActivities = generateActivitiesForType(adventureType, activities);

  // Generate realistic member count
  const memberCount = Math.floor(Math.random() * 8) + 2; // 2-9 members
  const maxMembers = Math.max(memberCount + 2, Math.floor(Math.random() * 5) + 6); // Room for growth

  // Generate start date within next 6 months
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 180));

  // Generate duration based on adventure type
  const duration = generateDurationForType(adventureType);

  // Generate budget based on adventure type and destination
  const budgetRange = generateBudgetForType(adventureType, destination);

  return {
    id: `group-${id}`,
    title: generateGroupTitle(adventureType, destination),
    description: generateGroupDescription(adventureType, destination),
    destination,
    adventureType,
    activities: groupActivities,
    startDate: startDate.toISOString(),
    duration,
    budgetRange,
    members: generateMockMembers(memberCount),
    maxMembers,
    experienceLevel: Math.floor(Math.random() * 4) + 2, // 2-5 scale
    isPublic: Math.random() > 0.2, // 80% public
    tags: generateTagsForType(adventureType),
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Within last 30 days
    organizer: {
      id: `user-organizer-${id}`,
      name: generateRandomName(),
      experience: Math.floor(Math.random() * 4) + 2
    },
    requirements: generateRequirementsForType(adventureType),
    itinerary: generateBasicItinerary(duration, groupActivities),
    imageUrl: generateImageUrl(adventureType, destination)
  };
};

const generateMockMembers = (count) => {
  const members = [];

  for (let i = 1; i <= count; i++) {
    members.push(generateMockMember(i));
  }

  return members;
};

const generateMockMember = (id) => {
  const names = [
    'Alex Chen', 'Sarah Johnson', 'Michael Rodriguez', 'Emma Thompson', 'David Kim',
    'Lisa Wang', 'Carlos Silva', 'Anna Martinez', 'James Wilson', 'Maria Garcia',
    'Ryan O\'Connor', 'Sophie Dubois', 'Ahmed Hassan', 'Priya Patel', 'Luca Rossi',
    'Yuki Tanaka', 'Lars Andersen', 'Zara Ali', 'Tom Anderson', 'Nina Kowalski'
  ];

  return {
    userId: `user-${id}`,
    name: names[Math.floor(Math.random() * names.length)],
    age: Math.floor(Math.random() * 30) + 22, // 22-52 years old
    personalityProfile: generateRandomPersonality(),
    travelPreferences: generateRandomTravelPreferences(),
    experienceLevel: {
      overall: Math.floor(Math.random() * 4) + 2, // 2-5
      categories: generateExperienceCategories()
    },
    budgetRange: generateRandomBudgetRange(),
    activityPreferences: generateRandomActivityPreferences(),
    joinedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Within last 2 weeks
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user-${id}`,
    location: generateRandomLocation(),
    languages: generateRandomLanguages(),
    isVerified: Math.random() > 0.3 // 70% verified
  };
};

const generateRandomPersonality = () => {
  // Generate realistic personality scores with some correlation
  const baseEnergy = Math.random() * 60 + 20; // 20-80
  const baseSocial = Math.random() * 70 + 15; // 15-85
  const baseAdventure = Math.random() * 80 + 10; // 10-90
  const baseRisk = Math.random() * 70 + 15; // 15-85

  // Add some correlation - more adventurous people tend to have higher risk tolerance
  const correlatedRisk = Math.min(90, baseRisk + (baseAdventure - 50) * 0.3);

  // Social and energy often correlate
  const correlatedEnergy = Math.min(90, baseEnergy + (baseSocial - 50) * 0.2);

  return {
    energyLevel: Math.round(correlatedEnergy),
    socialPreference: Math.round(baseSocial),
    adventureStyle: Math.round(baseAdventure),
    riskTolerance: Math.round(correlatedRisk),
    calculatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Within last week
  };
};

const generateRandomTravelPreferences = () => {
  const adventureStyles = ['comfort', 'explorer', 'adventurer', 'cultural'];
  const budgetPreferences = ['budget', 'moderate', 'luxury'];
  const planningStyles = ['spontaneous', 'flexible', 'structured', 'detailed'];
  const groupPreferences = ['solo', 'couple', 'small_group', 'large_group'];

  return {
    adventureStyle: adventureStyles[Math.floor(Math.random() * adventureStyles.length)],
    budgetPreference: budgetPreferences[Math.floor(Math.random() * budgetPreferences.length)],
    planningStyle: planningStyles[Math.floor(Math.random() * planningStyles.length)],
    groupPreference: groupPreferences[Math.floor(Math.random() * groupPreferences.length)]
  };
};

const generateExperienceCategories = () => {
  const categories = ['hiking', 'climbing', 'diving', 'cultural', 'urban', 'wilderness'];
  const experiences = {};

  categories.forEach(category => {
    experiences[category] = Math.floor(Math.random() * 4) + 1; // 1-5
  });

  return experiences;
};

const generateRandomBudgetRange = () => {
  const budgetLevels = [
    { min: 500, max: 1500, flexibility: 0.3 },
    { min: 1000, max: 3000, flexibility: 0.4 },
    { min: 2000, max: 5000, flexibility: 0.2 },
    { min: 3000, max: 8000, flexibility: 0.15 },
    { min: 5000, max: 15000, flexibility: 0.1 }
  ];

  const level = budgetLevels[Math.floor(Math.random() * budgetLevels.length)];

  return {
    ...level,
    currency: 'USD'
  };
};

const generateRandomActivityPreferences = () => {
  const allActivities = [
    'hiking', 'scuba-diving', 'rock-climbing', 'photography', 'cooking-classes',
    'temple-visits', 'wildlife-viewing', 'city-tours', 'beach-relaxation',
    'mountain-trekking', 'cultural-workshops', 'nightlife', 'museums',
    'adventure-sports', 'meditation', 'spa-treatments', 'local-cuisine',
    'historical-sites', 'art-galleries', 'music-festivals', 'shopping',
    'boat-tours', 'zip-lining', 'surfing', 'yoga', 'wine-tasting'
  ];

  const numPreferred = Math.floor(Math.random() * 8) + 3; // 3-10 preferred
  const preferred = shuffleArray([...allActivities]).slice(0, numPreferred);

  const numMustHave = Math.floor(Math.random() * 3) + 1; // 1-3 must have
  const mustHave = shuffleArray(preferred).slice(0, numMustHave);

  const numDisliked = Math.floor(Math.random() * 4); // 0-3 disliked
  const remaining = allActivities.filter(activity => !preferred.includes(activity));
  const disliked = shuffleArray(remaining).slice(0, numDisliked);

  const numDealBreakers = Math.floor(Math.random() * 2); // 0-1 deal breakers
  const dealBreakers = shuffleArray(disliked).slice(0, numDealBreakers);

  return {
    preferred,
    mustHave,
    disliked,
    dealBreakers
  };
};

const generateActivitiesForType = (adventureType, allActivities) => {
  const typeActivities = {
    'cultural-immersion': ['temple-visits', 'cultural-workshops', 'local-cuisine', 'historical-sites', 'museums', 'art-galleries'],
    'adventure-sports': ['rock-climbing', 'zip-lining', 'surfing', 'mountain-trekking', 'adventure-sports', 'hiking'],
    'wellness-retreat': ['meditation', 'spa-treatments', 'yoga', 'beach-relaxation', 'wellness-workshops'],
    'luxury-travel': ['wine-tasting', 'spa-treatments', 'fine-dining', 'private-tours', 'luxury-experiences'],
    'budget-backpacking': ['hiking', 'city-tours', 'local-cuisine', 'hostels', 'public-transport'],
    'photography-tour': ['photography', 'wildlife-viewing', 'landscapes', 'city-tours', 'sunrise-sessions'],
    'wildlife-safari': ['wildlife-viewing', 'nature-walks', 'photography', 'camping', 'guided-tours'],
    'culinary-journey': ['cooking-classes', 'local-cuisine', 'food-tours', 'markets', 'wine-tasting'],
    'spiritual-retreat': ['meditation', 'temple-visits', 'spiritual-practices', 'quiet-reflection'],
    'extreme-sports': ['rock-climbing', 'bungee-jumping', 'paragliding', 'extreme-sports', 'high-adrenaline']
  };

  const baseActivities = typeActivities[adventureType] || ['city-tours', 'local-cuisine', 'cultural-workshops'];
  const numActivities = Math.floor(Math.random() * 4) + 3; // 3-6 activities

  // Mix type-specific with some random activities
  const typeSpecific = shuffleArray(baseActivities).slice(0, Math.min(baseActivities.length, numActivities - 1));
  const additional = shuffleArray(allActivities.filter(a => !typeSpecific.includes(a))).slice(0, numActivities - typeSpecific.length);

  return [...typeSpecific, ...additional];
};

const generateDurationForType = (adventureType) => {
  const typeDurations = {
    'cultural-immersion': [5, 7, 10, 14],
    'adventure-sports': [3, 5, 7, 10],
    'wellness-retreat': [3, 5, 7],
    'luxury-travel': [7, 10, 14],
    'budget-backpacking': [14, 21, 30],
    'photography-tour': [7, 10, 14],
    'wildlife-safari': [5, 7, 10],
    'culinary-journey': [5, 7, 10],
    'spiritual-retreat': [7, 10, 14],
    'extreme-sports': [3, 5, 7]
  };

  const durations = typeDurations[adventureType] || [5, 7, 10];
  return durations[Math.floor(Math.random() * durations.length)];
};

const generateBudgetForType = (adventureType, destination) => {
  const baseBudgets = {
    'cultural-immersion': { min: 1000, max: 3000 },
    'adventure-sports': { min: 1500, max: 4000 },
    'wellness-retreat': { min: 2000, max: 5000 },
    'luxury-travel': { min: 5000, max: 15000 },
    'budget-backpacking': { min: 500, max: 1500 },
    'photography-tour': { min: 2000, max: 4000 },
    'wildlife-safari': { min: 3000, max: 8000 },
    'culinary-journey': { min: 2000, max: 5000 },
    'spiritual-retreat': { min: 1000, max: 3000 },
    'extreme-sports': { min: 2000, max: 5000 }
  };

  const base = baseBudgets[adventureType] || { min: 1000, max: 3000 };

  // Adjust for destination cost
  const expensiveDestinations = ['Japan', 'Norway', 'Iceland', 'Switzerland'];
  const cheapDestinations = ['Thailand', 'Vietnam', 'Nepal', 'Peru'];

  let multiplier = 1;
  if (expensiveDestinations.some(dest => destination.includes(dest))) {
    multiplier = 1.5;
  } else if (cheapDestinations.some(dest => destination.includes(dest))) {
    multiplier = 0.7;
  }

  return {
    min: Math.round(base.min * multiplier),
    max: Math.round(base.max * multiplier),
    currency: 'USD'
  };
};

const generateGroupTitle = (adventureType, destination) => {
  const titles = {
    'cultural-immersion': [`Cultural Deep Dive in ${destination}`, `Authentic ${destination} Experience`, `Local Life in ${destination}`],
    'adventure-sports': [`Adventure Quest in ${destination}`, `Extreme ${destination} Challenge`, `Adrenaline ${destination}`],
    'wellness-retreat': [`Wellness Journey in ${destination}`, `Mindful ${destination} Retreat`, `Restore in ${destination}`],
    'luxury-travel': [`Luxury ${destination} Escape`, `Premium ${destination} Experience`, `Exclusive ${destination} Journey`],
    'budget-backpacking': [`Backpacking ${destination}`, `Budget Adventure in ${destination}`, `Explore ${destination} Cheaply`],
    'photography-tour': [`Photography Tour of ${destination}`, `Capture ${destination}`, `Visual Journey through ${destination}`],
    'wildlife-safari': [`Wildlife Safari in ${destination}`, `Nature Expedition in ${destination}`, `Animal Encounters in ${destination}`],
    'culinary-journey': [`Culinary Adventure in ${destination}`, `Food Tour of ${destination}`, `Taste ${destination}`],
    'spiritual-retreat': [`Spiritual Journey in ${destination}`, `Mindful ${destination} Retreat`, `Inner Peace in ${destination}`],
    'extreme-sports': [`Extreme Sports in ${destination}`, `Thrill Seeking in ${destination}`, `Adrenaline Rush ${destination}`]
  };

  const typeTitles = titles[adventureType] || [`Adventure in ${destination}`];
  return typeTitles[Math.floor(Math.random() * typeTitles.length)];
};

const generateGroupDescription = (adventureType, destination) => {
  const descriptions = {
    'cultural-immersion': [
      `Join us for an authentic cultural experience in ${destination}. We'll immerse ourselves in local traditions, visit hidden gems, and connect with the community.`,
      `Discover the real ${destination} through local eyes. This journey focuses on cultural exchange and meaningful connections.`,
      `Experience ${destination} like a local. We'll explore traditional markets, participate in cultural workshops, and share meals with local families.`
    ],
    'adventure-sports': [
      `Ready for an adrenaline-packed adventure in ${destination}? We'll tackle challenging activities and push our limits together.`,
      `Extreme sports enthusiasts unite! Join our high-energy expedition in ${destination} for unforgettable thrills.`,
      `Adventure seekers wanted for an action-packed journey through ${destination}. Safety first, fun always!`
    ],
    'wellness-retreat': [
      `Find your inner peace in the tranquil setting of ${destination}. This retreat focuses on mindfulness, relaxation, and personal growth.`,
      `Reconnect with yourself in ${destination}. We'll combine wellness practices with beautiful surroundings for a restorative experience.`,
      `Join our wellness journey in ${destination}. Expect daily meditation, spa treatments, and healthy cuisine in stunning locations.`
    ]
  };

  const typeDescriptions = descriptions[adventureType] || [
    `Join our group adventure in ${destination}. We'll explore together, share experiences, and create lasting memories.`
  ];

  return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
};

const generateTagsForType = (adventureType) => {
  const typeTags = {
    'cultural-immersion': ['culture', 'local-experience', 'authentic', 'traditional'],
    'adventure-sports': ['adventure', 'extreme', 'active', 'challenging'],
    'wellness-retreat': ['wellness', 'mindful', 'relaxing', 'peaceful'],
    'luxury-travel': ['luxury', 'premium', 'exclusive', 'comfort'],
    'budget-backpacking': ['budget', 'backpacking', 'affordable', 'simple'],
    'photography-tour': ['photography', 'visual', 'creative', 'scenic'],
    'wildlife-safari': ['wildlife', 'nature', 'animals', 'conservation'],
    'culinary-journey': ['food', 'culinary', 'local-cuisine', 'cooking'],
    'spiritual-retreat': ['spiritual', 'mindful', 'meditation', 'inner-peace'],
    'extreme-sports': ['extreme', 'adrenaline', 'challenging', 'thrill']
  };

  const baseTags = typeTags[adventureType] || ['adventure', 'travel', 'group'];
  const commonTags = ['social', 'international', 'guided', 'safe', 'inclusive'];

  const selectedCommon = shuffleArray(commonTags).slice(0, 2);
  return [...baseTags, ...selectedCommon];
};

const generateRequirementsForType = (adventureType) => {
  const requirements = {
    'adventure-sports': ['Physical fitness required', 'Previous experience preferred', 'Age 18-45'],
    'extreme-sports': ['Advanced fitness level', 'Medical clearance', 'Sign waiver'],
    'wellness-retreat': ['Open mind', 'Commitment to practices', 'Respect for quiet spaces'],
    'luxury-travel': ['Flexible schedule', 'Appreciation for finer things'],
    'budget-backpacking': ['Flexibility', 'Shared accommodations OK', 'Basic fitness'],
    'cultural-immersion': ['Cultural sensitivity', 'Respectful behavior', 'Interest in learning'],
    'wildlife-safari': ['Early morning availability', 'Quiet observation skills', 'Respect for wildlife'],
    'photography-tour': ['Camera equipment', 'Photography interest', 'Early starts'],
    'culinary-journey': ['Open palate', 'Food allergies disclosure', 'Participation in cooking'],
    'spiritual-retreat': ['Meditation interest', 'Quiet reflection', 'Spiritual openness']
  };

  return requirements[adventureType] || ['Open mind', 'Positive attitude', 'Team player'];
};

const generateBasicItinerary = (duration, activities) => {
  const itinerary = [];
  const activitiesPerDay = Math.max(1, Math.floor(activities.length / duration));

  for (let day = 1; day <= duration; day++) {
    const dayActivities = activities.slice((day - 1) * activitiesPerDay, day * activitiesPerDay);

    itinerary.push({
      day,
      title: `Day ${day}`,
      activities: dayActivities.length > 0 ? dayActivities : ['free-time'],
      description: `Explore and enjoy ${dayActivities.join(', ') || 'free time'}`
    });
  }

  return itinerary;
};

const generateImageUrl = (adventureType, destination) => {
  // Generate placeholder image URLs - in real app these would be actual photos
  const imageId = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/400/300?random=${imageId}`;
};

const generateRandomLocation = () => {
  const cities = [
    'New York, USA', 'London, UK', 'Tokyo, Japan', 'Sydney, Australia',
    'Berlin, Germany', 'Toronto, Canada', 'Amsterdam, Netherlands',
    'Stockholm, Sweden', 'Barcelona, Spain', 'Singapore'
  ];
  return cities[Math.floor(Math.random() * cities.length)];
};

const generateRandomLanguages = () => {
  const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Mandarin', 'Arabic', 'Russian'];
  const numLanguages = Math.floor(Math.random() * 3) + 1; // 1-3 languages
  return shuffleArray(languages).slice(0, numLanguages);
};

// Utility function to shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Export mock user profile for testing
export const generateMockUserProfile = () => {
  return {
    userId: 'test-user',
    personalityProfile: generateRandomPersonality(),
    travelPreferences: generateRandomTravelPreferences(),
    experienceLevel: {
      overall: Math.floor(Math.random() * 4) + 2,
      categories: generateExperienceCategories()
    },
    budgetRange: generateRandomBudgetRange(),
    activityPreferences: generateRandomActivityPreferences(),
    availabilityConstraints: {
      dates: [
        {
          start: new Date(),
          end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Next 3 months
        }
      ],
      duration: {
        min: 5,
        max: 14
      },
      locations: ['Europe', 'Asia', 'North America']
    },
    lastUpdated: new Date()
  };
};

// Export default mock data
export const mockGroups = generateMockGroups(25);
export const mockUserProfile = generateMockUserProfile();