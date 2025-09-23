import { imageAssetService } from '../services/image-asset-service';

// Mock adventure data for development and testing
export const mockAdventures = [
  {
    id: 1,
    title: "Northern Lights Photography Expedition",
    location: "Reykjavik, Iceland",
    price: 1250,
    currency: "USD",
    rating: 4.8,
    reviewCount: 247,
    duration: "5 days",
    groupSize: "6-12 people",
    image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1551524164-4ddc4cc6c5c5?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
    ],
    description: "Capture the ethereal beauty of the Aurora Borealis in Iceland's pristine wilderness.",
    longDescription: "Embark on an unforgettable photographic journey through Iceland's dramatic landscapes in pursuit of the legendary Northern Lights. This expedition combines expert photography instruction with intimate access to some of the world's most spectacular natural phenomena. Over 5 incredible days, you'll venture to remote locations away from light pollution, where the Aurora Borealis dances across pristine Arctic skies in brilliant displays of green, purple, and blue.",
    itinerary: [
      {
        day: 1,
        title: "Arrival in Reykjavik",
        activities: ["Airport pickup and transfer to hotel", "Welcome dinner and briefing", "Photography equipment check", "Northern Lights theory workshop"],
        accommodation: "Reykjavik Marina Hotel"
      },
      {
        day: 2,
        title: "Golden Circle and Aurora Hunt",
        activities: ["Visit Gullfoss waterfall for daytime photography", "Explore Geysir geothermal area", "Thingvellir National Park tour", "First Northern Lights photography session"],
        accommodation: "Rural guesthouse"
      },
      {
        day: 3,
        title: "South Coast Adventure",
        activities: ["Seljalandsfoss and Skogafoss waterfalls", "Black sand beaches of Vik", "Ice cave exploration", "Aurora photography at Jokulsarlon glacier lagoon"],
        accommodation: "Countryside lodge"
      },
      {
        day: 4,
        title: "Snaefellsnes Peninsula",
        activities: ["Kirkjufell mountain photography", "Coastal cliffs and fishing villages", "Advanced Northern Lights techniques", "Group photo review session"],
        accommodation: "Peninsula hotel"
      },
      {
        day: 5,
        title: "Final Shoot and Departure",
        activities: ["Final aurora attempt if needed", "Photo editing workshop", "Portfolio review and feedback", "Departure transfers"],
        accommodation: "Reykjavik departure hotel"
      }
    ],
    included: [
      "Professional photography guide",
      "All accommodations (4 nights)",
      "All meals and refreshments",
      "Transportation in heated 4x4 vehicles",
      "Photography equipment rental available",
      "Northern Lights guarantee (extra night if no sighting)",
      "Photo editing workshop",
      "Digital copy of all location coordinates"
    ],
    notIncluded: [
      "International flights",
      "Travel insurance",
      "Personal photography equipment",
      "Alcoholic beverages",
      "Souvenirs and personal expenses",
      "Tips and gratuities"
    ],
    requirements: [
      "Basic photography knowledge recommended",
      "Warm, waterproof clothing essential",
      "Physical fitness for outdoor activities in cold conditions",
      "Valid passport required",
      "Travel insurance recommended"
    ],
    featured: true,
    difficulty: "moderate",
    tags: ["photography", "nature", "arctic"],
    availability: "Available",
    vendor: {
      id: "arctic-adventures",
      name: "Arctic Adventures Photography",
      rating: 4.9,
      reviewCount: 1247,
      verified: true,
      establishedYear: 2015,
      location: "Reykjavik, Iceland",
      description: "Specializing in Northern Lights and landscape photography tours across Iceland's most dramatic locations.",
      contactEmail: "info@arcticadventures.com",
      contactPhone: "+354-555-0123",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    pricing: {
      basePrice: 1250,
      currency: "USD",
      groupDiscounts: [
        { size: "5-9 people", discount: 10 },
        { size: "10+ people", discount: 15 }
      ],
      seasonalPricing: [
        { season: "Peak (Dec-Feb)", modifier: 1.2 },
        { season: "Shoulder (Mar-Apr, Oct-Nov)", modifier: 1.0 },
        { season: "Off-peak (May-Sep)", modifier: 0.8 }
      ]
    },
    availability: {
      available: ["2024-12-15", "2024-12-22", "2025-01-05", "2025-01-12", "2025-01-19", "2025-02-02", "2025-02-09"],
      booked: ["2024-12-29", "2025-01-26", "2025-02-16"],
      limited: ["2025-02-23", "2025-03-02"]
    },
    reviews: [
      {
        id: 1,
        user: "Sarah Chen",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b884?w=150&h=150&fit=crop&crop=face",
        rating: 5,
        date: "2024-02-15",
        content: "Absolutely incredible experience! Our guide Magnus was incredibly knowledgeable about both photography and the Aurora Borealis. We saw the lights on 3 out of 5 nights, with one evening being truly spectacular. The photo editing workshop was also very helpful.",
        helpful: 23,
        images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop"]
      },
      {
        id: 2,
        user: "David Rodriguez",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        rating: 5,
        date: "2024-01-28",
        content: "The Northern Lights were amazing, but what made this trip special was the overall experience. Small group size meant personalized attention, accommodations were comfortable, and the landscape photography during the day was just as rewarding as the aurora chasing at night.",
        helpful: 18
      },
      {
        id: 3,
        user: "Emma Thompson",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        rating: 4,
        date: "2024-01-10",
        content: "Great trip overall! Weather was challenging our first two nights, but the guide was excellent at finding clear skies. The Iceland landscapes during the day were breathtaking. Only minor complaint was that some of the accommodations were a bit basic, but that's part of the adventure!",
        helpful: 12
      }
    ]
  },
  {
    id: 2,
    title: "Amazon Rainforest Conservation Trek",
    location: "Manaus, Brazil",
    price: 890,
    currency: "USD",
    rating: 4.9,
    reviewCount: 183,
    duration: "7 days",
    groupSize: "4-8 people",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1574391884720-bfdb6e0d0b84?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1593995863951-057c19ae4eaf?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&h=600&fit=crop"
    ],
    description: "Immerse yourself in the world's largest rainforest while contributing to conservation efforts.",
    longDescription: "Join us on an extraordinary 7-day conservation expedition deep into the heart of the Amazon rainforest. This isn't just a trek - it's an opportunity to make a real difference while experiencing one of the world's most biodiverse ecosystems. Working alongside local researchers and indigenous communities, you'll contribute to vital conservation projects while discovering the secrets of this incredible wilderness.",
    itinerary: [
      {
        day: 1,
        title: "Arrival and Orientation",
        activities: ["Arrival in Manaus", "Meet the research team", "Introduction to conservation projects", "First night in eco-lodge"],
        accommodation: "Amazon Eco Lodge"
      },
      {
        day: 2,
        title: "Into the Rainforest",
        activities: ["Journey to research station", "Canopy walk introduction", "Wildlife tracking workshop", "Night sounds expedition"],
        accommodation: "Research Station"
      },
      {
        day: 3,
        title: "Conservation Work Day 1",
        activities: ["Tree sampling and cataloging", "Primate behavior observation", "Stream water quality testing", "Indigenous community visit"],
        accommodation: "Research Station"
      }
    ],
    included: ["All accommodations", "All meals", "Research participation", "Expert guides", "Transportation"],
    notIncluded: ["International flights", "Personal gear", "Travel insurance"],
    requirements: ["Good physical fitness", "Vaccinations required", "Suitable for ages 16+"],
    featured: false,
    difficulty: "challenging",
    tags: ["conservation", "hiking", "wildlife"],
    availability: "Available",
    vendor: {
      id: "amazon-conservation",
      name: "Amazon Conservation Expeditions",
      rating: 4.8,
      reviewCount: 456,
      verified: true,
      establishedYear: 2012,
      location: "Manaus, Brazil",
      description: "Leading conservation organization focused on Amazon rainforest research and protection.",
      contactEmail: "expeditions@amazonconservation.org",
      contactPhone: "+55-92-555-0456"
    },
    pricing: {
      basePrice: 890,
      currency: "USD",
      groupDiscounts: [
        { size: "5-7 people", discount: 8 },
        { size: "8+ people", discount: 12 }
      ],
      seasonalPricing: [
        { season: "Dry season (Jun-Sep)", modifier: 1.15 },
        { season: "Wet season (Oct-May)", modifier: 0.85 }
      ]
    },
    availability: {
      available: ["2024-12-10", "2025-01-14", "2025-02-18", "2025-03-11"],
      booked: ["2025-01-07", "2025-02-04"],
      limited: ["2025-03-25"]
    },
    reviews: [
      {
        id: 1,
        user: "Marcus Johnson",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        rating: 5,
        date: "2024-03-12",
        content: "Life-changing experience! Contributing to real conservation work while exploring the Amazon was incredible. The researchers were knowledgeable and passionate, and seeing the impact of our work was very rewarding.",
        helpful: 15
      }
    ]
  },
  {
    id: 3,
    title: "Himalayan Base Camp Cultural Journey",
    location: "Kathmandu, Nepal",
    price: 2100,
    currency: "USD",
    rating: 4.7,
    reviewCount: 312,
    duration: "14 days",
    groupSize: "8-15 people",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop",
    description: "Trek to Everest Base Camp while experiencing authentic Sherpa culture and traditions.",
    featured: true,
    difficulty: "challenging",
    tags: ["trekking", "culture", "mountains"],
    availability: "Limited"
  },
  {
    id: 4,
    title: "Mediterranean Sailing Adventure",
    location: "Santorini, Greece",
    price: 750,
    currency: "USD",
    rating: 4.6,
    reviewCount: 156,
    duration: "4 days",
    groupSize: "6-10 people",
    image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&h=600&fit=crop",
    description: "Sail through crystal-clear waters and explore hidden coves in the Greek islands.",
    featured: false,
    difficulty: "easy",
    tags: ["sailing", "islands", "relaxation"],
    availability: "Available"
  },
  {
    id: 5,
    title: "Patagonia Wildlife Photography",
    location: "El Calafate, Argentina",
    price: 1650,
    currency: "USD",
    rating: 4.9,
    reviewCount: 89,
    duration: "9 days",
    groupSize: "4-6 people",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop",
    description: "Capture stunning landscapes and unique wildlife in one of the world's last frontiers.",
    featured: true,
    difficulty: "moderate",
    tags: ["photography", "wildlife", "landscapes"],
    availability: "Available"
  },
  {
    id: 6,
    title: "Japanese Temple and Garden Retreat",
    location: "Kyoto, Japan",
    price: 1180,
    currency: "USD",
    rating: 4.8,
    reviewCount: 203,
    duration: "6 days",
    groupSize: "8-12 people",
    image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=600&fit=crop",
    description: "Find inner peace through traditional meditation practices in ancient Japanese temples.",
    featured: false,
    difficulty: "easy",
    tags: ["culture", "meditation", "temples"],
    availability: "Available"
  }
];

export const adventureCategories = [
  { id: "all", name: "All Adventures", count: mockAdventures.length },
  { id: "photography", name: "Photography", count: 2 },
  { id: "culture", name: "Cultural", count: 2 },
  { id: "wildlife", name: "Wildlife", count: 2 },
  { id: "trekking", name: "Trekking", count: 2 },
  { id: "relaxation", name: "Relaxation", count: 2 }
];