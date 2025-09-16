// Mock vendor data for development and testing
export const mockVendors = [
  {
    id: "arctic-adventures",
    name: "Arctic Adventures Photography",
    location: "Reykjavik, Iceland",
    description: "Specializing in Northern Lights and landscape photography tours across Iceland's most dramatic locations.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    coverImage: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&h=400&fit=crop",
    rating: 4.9,
    reviewCount: 1247,
    responseTime: "within 2 hours",
    verified: true,
    establishedYear: 2015,
    contactEmail: "info@arcticadventures.com",
    contactPhone: "+354-555-0123",
    website: "https://arcticadventures.com",
    categories: ["Photography", "Nature", "Arctic"],
    priceRange: "$1000-$2000",
    languages: ["English", "Icelandic", "German"],
    certifications: [
      "Iceland Tourism Board Certified",
      "Professional Photography Guide",
      "First Aid Certified"
    ],
    badges: ["Top Rated", "Quick Response", "Eco-Friendly"],
    gallery: [
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1551524164-4ddc4cc6c5c5?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&h=400&fit=crop"
    ],
    stats: {
      totalBookings: 2847,
      repeatCustomers: 78,
      averageBookingValue: 1450,
      yearsInBusiness: 9
    },
    adventureTypes: ["Photography Tours", "Northern Lights", "Landscape Photography", "Wildlife Photography"],
    adventureCount: 12,
    coordinates: [64.1466, -21.9426], // Reykjavik coordinates
    aboutLong: "Arctic Adventures Photography has been Iceland's premier photography tour company since 2015. Founded by Magnus Eriksson, a renowned landscape photographer, we specialize in capturing the raw beauty of Iceland's dramatic landscapes and the mystical Northern Lights. Our small-group expeditions combine expert photography instruction with unparalleled access to Iceland's most spectacular locations. We pride ourselves on sustainable tourism practices and deep respect for Iceland's pristine wilderness.",
    socialMedia: {
      instagram: "@arcticadventures",
      facebook: "ArcticAdventuresIceland",
      youtube: "ArcticAdventuresPhoto"
    }
  },
  {
    id: "amazon-conservation",
    name: "Amazon Conservation Expeditions",
    location: "Manaus, Brazil",
    description: "Leading conservation organization focused on Amazon rainforest research and protection.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    coverImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=400&fit=crop",
    rating: 4.8,
    reviewCount: 456,
    responseTime: "within 4 hours",
    verified: true,
    establishedYear: 2012,
    contactEmail: "expeditions@amazonconservation.org",
    contactPhone: "+55-92-555-0456",
    website: "https://amazonconservation.org",
    categories: ["Conservation", "Wildlife", "Research"],
    priceRange: "$800-$1200",
    languages: ["English", "Portuguese", "Spanish"],
    certifications: [
      "Brazilian Tourism Authority",
      "Conservation International Partner",
      "Rainforest Alliance Certified"
    ],
    badges: ["Conservation Leader", "Scientific Research", "Community Partner"],
    gallery: [
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1574391884720-bfdb6e0d0b84?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1593995863951-057c19ae4eaf?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&h=400&fit=crop"
    ],
    stats: {
      totalBookings: 1247,
      repeatCustomers: 45,
      averageBookingValue: 950,
      yearsInBusiness: 12
    },
    adventureTypes: ["Conservation Trek", "Wildlife Research", "Canopy Exploration", "River Expeditions"],
    adventureCount: 8,
    coordinates: [-3.1190, -60.0217], // Manaus coordinates
    aboutLong: "Amazon Conservation Expeditions was founded in 2012 with a mission to protect the Amazon rainforest through sustainable ecotourism and scientific research. Led by Dr. Maria Santos, a renowned conservation biologist, our organization offers unique opportunities for travelers to contribute to vital research while experiencing the world's most biodiverse ecosystem. Every expedition directly supports local communities and ongoing conservation projects.",
    socialMedia: {
      instagram: "@amazonconservation",
      facebook: "AmazonConservationExpeditions",
      twitter: "@AmazonConserve"
    }
  },
  {
    id: "himalayan-trekking",
    name: "Himalayan Cultural Trekking",
    location: "Kathmandu, Nepal",
    description: "Authentic Himalayan trekking experiences with deep cultural immersion and Sherpa guide expertise.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f87?w=150&h=150&fit=crop&crop=face",
    coverImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&h=400&fit=crop",
    rating: 4.7,
    reviewCount: 312,
    responseTime: "within 6 hours",
    verified: true,
    establishedYear: 2008,
    contactEmail: "trek@himalayancultural.com",
    contactPhone: "+977-1-555-0789",
    website: "https://himalayancultural.com",
    categories: ["Trekking", "Culture", "Mountains"],
    priceRange: "$1500-$3000",
    languages: ["English", "Nepali", "Hindi", "Tibetan"],
    certifications: [
      "Nepal Tourism Board Licensed",
      "International Mountain Guide",
      "Cultural Heritage Specialist"
    ],
    badges: ["Cultural Expert", "High Altitude Specialist", "Sherpa Guides"],
    gallery: [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop"
    ],
    stats: {
      totalBookings: 892,
      repeatCustomers: 32,
      averageBookingValue: 2100,
      yearsInBusiness: 16
    },
    adventureTypes: ["Base Camp Treks", "Cultural Immersion", "High Altitude Climbing", "Village Homestays"],
    adventureCount: 15,
    coordinates: [27.7172, 85.3240], // Kathmandu coordinates
    aboutLong: "Himalayan Cultural Trekking has been sharing the beauty and culture of Nepal since 2008. Founded by Pemba Sherpa, our team combines generations of mountain expertise with deep cultural knowledge. We offer authentic experiences that benefit local communities while providing trekkers with unforgettable journeys through the world's highest mountains.",
    socialMedia: {
      instagram: "@himalayancultural",
      facebook: "HimalayanCulturalTrekking"
    }
  },
  {
    id: "mediterranean-sailing",
    name: "Mediterranean Sailing Co.",
    location: "Santorini, Greece",
    description: "Luxury sailing adventures through the Greek islands with expert crew and authentic Mediterranean experiences.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    coverImage: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200&h=400&fit=crop",
    rating: 4.6,
    reviewCount: 156,
    responseTime: "within 1 hour",
    verified: true,
    establishedYear: 2018,
    contactEmail: "sail@medsailing.gr",
    contactPhone: "+30-22860-55123",
    website: "https://mediterraneansailing.gr",
    categories: ["Sailing", "Islands", "Luxury"],
    priceRange: "$600-$1000",
    languages: ["English", "Greek", "Italian", "French"],
    certifications: [
      "Greek Port Authority Licensed",
      "RYA Yachtmaster Offshore",
      "Marine Safety Certified"
    ],
    badges: ["Luxury Experience", "Island Expert", "Sunset Specialist"],
    gallery: [
      "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop"
    ],
    stats: {
      totalBookings: 445,
      repeatCustomers: 65,
      averageBookingValue: 750,
      yearsInBusiness: 6
    },
    adventureTypes: ["Island Hopping", "Sunset Cruises", "Private Charters", "Snorkeling Tours"],
    adventureCount: 6,
    coordinates: [36.3932, 25.4615], // Santorini coordinates
    aboutLong: "Mediterranean Sailing Co. was established in 2018 by Captain Dimitris Papadopoulos, bringing decades of sailing experience to the crystal-clear waters of the Aegean Sea. We specialize in small-group sailing adventures that showcase the hidden gems of the Greek islands, combining luxury comfort with authentic local experiences.",
    socialMedia: {
      instagram: "@medsailingco",
      facebook: "MediterraneanSailingCompany"
    }
  },
  {
    id: "patagonia-wildlife",
    name: "Patagonia Wildlife Photography",
    location: "El Calafate, Argentina",
    description: "Capture stunning landscapes and unique wildlife in one of the world's last frontiers with expert wildlife photographers.",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
    coverImage: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=400&fit=crop",
    rating: 4.9,
    reviewCount: 89,
    responseTime: "within 3 hours",
    verified: true,
    establishedYear: 2016,
    contactEmail: "photo@patagoniawildlife.com",
    contactPhone: "+54-2902-555-0234",
    website: "https://patagoniawildlife.com",
    categories: ["Photography", "Wildlife", "Landscapes"],
    priceRange: "$1400-$2000",
    languages: ["English", "Spanish"],
    certifications: [
      "Argentina Tourism Certified",
      "Wildlife Photography Specialist",
      "Patagonia National Park Guide"
    ],
    badges: ["Wildlife Expert", "Small Groups", "Photography Pro"],
    gallery: [
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop"
    ],
    stats: {
      totalBookings: 234,
      repeatCustomers: 28,
      averageBookingValue: 1650,
      yearsInBusiness: 8
    },
    adventureTypes: ["Wildlife Photography", "Glacier Tours", "Landscape Photography", "Puma Tracking"],
    adventureCount: 7,
    coordinates: [-50.3360, -72.2676], // El Calafate coordinates
    aboutLong: "Patagonia Wildlife Photography was founded in 2016 by Carlos Mendoza, a wildlife photographer passionate about preserving Patagonia's unique ecosystem through photography. Our expeditions focus on intimate wildlife encounters and dramatic landscape photography in this pristine wilderness.",
    socialMedia: {
      instagram: "@patagoniawildlife",
      facebook: "PatagoniaWildlifePhoto"
    }
  },
  {
    id: "kyoto-temples",
    name: "Kyoto Temple Retreats",
    location: "Kyoto, Japan",
    description: "Find inner peace through traditional meditation practices in ancient Japanese temples with experienced monks.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    coverImage: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&h=400&fit=crop",
    rating: 4.8,
    reviewCount: 203,
    responseTime: "within 8 hours",
    verified: true,
    establishedYear: 2010,
    contactEmail: "retreat@kyototemplereats.jp",
    contactPhone: "+81-75-555-0345",
    website: "https://kyototemplereats.jp",
    categories: ["Culture", "Meditation", "Temples"],
    priceRange: "$800-$1500",
    languages: ["English", "Japanese"],
    certifications: [
      "Japan Tourism Agency Licensed",
      "Zen Meditation Certified",
      "Cultural Heritage Guide"
    ],
    badges: ["Spiritual Guide", "Authentic Experience", "Temple Access"],
    gallery: [
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop"
    ],
    stats: {
      totalBookings: 567,
      repeatCustomers: 42,
      averageBookingValue: 1180,
      yearsInBusiness: 14
    },
    adventureTypes: ["Temple Meditation", "Garden Walks", "Tea Ceremony", "Cultural Immersion"],
    adventureCount: 5,
    coordinates: [35.0116, 135.7681], // Kyoto coordinates
    aboutLong: "Kyoto Temple Retreats has been facilitating spiritual journeys since 2010. Founded by Sensei Tanaka in partnership with several historic temples, we offer authentic meditation retreats that provide deep cultural immersion and spiritual renewal in the heart of ancient Japan.",
    socialMedia: {
      instagram: "@kyototemplereats",
      facebook: "KyotoTempleRetreats"
    }
  }
];

export const vendorCategories = [
  { id: "all", name: "All Vendors", count: mockVendors.length },
  { id: "photography", name: "Photography", count: 3 },
  { id: "culture", name: "Cultural", count: 2 },
  { id: "wildlife", name: "Wildlife", count: 2 },
  { id: "trekking", name: "Trekking", count: 1 },
  { id: "sailing", name: "Sailing", count: 1 },
  { id: "conservation", name: "Conservation", count: 1 },
  { id: "meditation", name: "Meditation", count: 1 }
];

export const vendorLocations = [
  "All Locations",
  "Iceland",
  "Brazil",
  "Nepal",
  "Greece",
  "Argentina",
  "Japan"
];

export const priceRanges = [
  { id: "all", label: "All Prices", min: 0, max: Infinity },
  { id: "budget", label: "$500 - $1000", min: 500, max: 1000 },
  { id: "mid", label: "$1000 - $1500", min: 1000, max: 1500 },
  { id: "premium", label: "$1500 - $2500", min: 1500, max: 2500 },
  { id: "luxury", label: "$2500+", min: 2500, max: Infinity }
];