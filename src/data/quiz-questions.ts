import { QuizQuestion } from '../types/personality';

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    text: "What's your ideal vacation morning?",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    category: 'energyLevel',
    options: [
      {
        id: '1a',
        text: 'Sunrise hike to catch the golden hour',
        imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
        traitScores: { energyLevel: 90, adventureStyle: 80, riskTolerance: 60 }
      },
      {
        id: '1b',
        text: 'Leisurely breakfast with ocean views',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
        traitScores: { energyLevel: 30, socialPreference: 40, adventureStyle: 20 }
      },
      {
        id: '1c',
        text: 'Morning yoga session on the beach',
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
        traitScores: { energyLevel: 50, adventureStyle: 40, riskTolerance: 30 }
      },
      {
        id: '1d',
        text: 'Sleep in and order room service',
        imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop',
        traitScores: { energyLevel: 10, socialPreference: 20, adventureStyle: 10 }
      }
    ]
  },
  {
    id: 2,
    text: "How do you prefer to explore a new city?",
    imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop",
    category: 'socialPreference',
    options: [
      {
        id: '2a',
        text: 'Join a local group tour with other travelers',
        imageUrl: 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?w=400&h=300&fit=crop',
        traitScores: { socialPreference: 90, energyLevel: 60, adventureStyle: 50 }
      },
      {
        id: '2b',
        text: 'Wander solo with just a map and curiosity',
        imageUrl: 'https://images.unsplash.com/photo-1476984251899-8d7fdfc5c92c?w=400&h=300&fit=crop',
        traitScores: { socialPreference: 10, adventureStyle: 80, riskTolerance: 70 }
      },
      {
        id: '2c',
        text: 'Explore with one close travel companion',
        imageUrl: 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=400&h=300&fit=crop',
        traitScores: { socialPreference: 50, adventureStyle: 60, energyLevel: 50 }
      },
      {
        id: '2d',
        text: 'Follow a detailed itinerary I researched',
        imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
        traitScores: { socialPreference: 30, adventureStyle: 20, riskTolerance: 10 }
      }
    ]
  },
  {
    id: 3,
    text: "What type of accommodation excites you most?",
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop",
    category: 'adventureStyle',
    options: [
      {
        id: '3a',
        text: 'Luxury resort with all amenities',
        imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop',
        traitScores: { adventureStyle: 20, riskTolerance: 10, energyLevel: 30 }
      },
      {
        id: '3b',
        text: 'Eco-lodge deep in the jungle',
        imageUrl: 'https://images.unsplash.com/photo-1618767689160-da3fb810aad7?w=400&h=300&fit=crop',
        traitScores: { adventureStyle: 90, riskTolerance: 80, energyLevel: 70 }
      },
      {
        id: '3c',
        text: 'Cozy local homestay with a family',
        imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop',
        traitScores: { adventureStyle: 70, socialPreference: 80, riskTolerance: 50 }
      },
      {
        id: '3d',
        text: 'Boutique hotel in the city center',
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        traitScores: { adventureStyle: 40, socialPreference: 60, energyLevel: 50 }
      }
    ]
  },
  {
    id: 4,
    text: "Your perfect beach day includes...",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
    category: 'energyLevel',
    options: [
      {
        id: '4a',
        text: 'Surfing, volleyball, and water sports',
        imageUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400&h=300&fit=crop',
        traitScores: { energyLevel: 95, socialPreference: 70, riskTolerance: 75 }
      },
      {
        id: '4b',
        text: 'Reading under an umbrella with a cocktail',
        imageUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=300&fit=crop',
        traitScores: { energyLevel: 20, socialPreference: 30, adventureStyle: 20 }
      },
      {
        id: '4c',
        text: 'Snorkeling and exploring tide pools',
        imageUrl: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=300&fit=crop',
        traitScores: { energyLevel: 60, adventureStyle: 70, riskTolerance: 50 }
      },
      {
        id: '4d',
        text: 'Beach bar hopping and meeting people',
        imageUrl: 'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=400&h=300&fit=crop',
        traitScores: { socialPreference: 90, energyLevel: 70, adventureStyle: 60 }
      }
    ]
  },
  {
    id: 5,
    text: "How do you handle travel mishaps?",
    imageUrl: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&h=600&fit=crop",
    category: 'riskTolerance',
    options: [
      {
        id: '5a',
        text: 'They're the best stories! Bring it on!',
        imageUrl: 'https://images.unsplash.com/photo-1502791451862-7bd8c1df43a7?w=400&h=300&fit=crop',
        traitScores: { riskTolerance: 95, adventureStyle: 90, energyLevel: 80 }
      },
      {
        id: '5b',
        text: 'Stay calm and find a solution',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        traitScores: { riskTolerance: 60, adventureStyle: 50, energyLevel: 50 }
      },
      {
        id: '5c',
        text: 'Get stressed but push through',
        imageUrl: 'https://images.unsplash.com/photo-1525373698358-041e3b460346?w=400&h=300&fit=crop',
        traitScores: { riskTolerance: 30, adventureStyle: 30, energyLevel: 40 }
      },
      {
        id: '5d',
        text: 'Avoid them with careful planning',
        imageUrl: 'https://images.unsplash.com/photo-1553697388-94e804e2f0f6?w=400&h=300&fit=crop',
        traitScores: { riskTolerance: 10, adventureStyle: 10, socialPreference: 40 }
      }
    ]
  },
  {
    id: 6,
    text: "What's your ideal travel group size?",
    imageUrl: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&h=600&fit=crop",
    category: 'socialPreference',
    options: [
      {
        id: '6a',
        text: 'Solo adventure - just me and the world',
        imageUrl: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=400&h=300&fit=crop',
        traitScores: { socialPreference: 10, adventureStyle: 80, riskTolerance: 70 }
      },
      {
        id: '6b',
        text: 'One special person to share it with',
        imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=300&fit=crop',
        traitScores: { socialPreference: 40, adventureStyle: 50, energyLevel: 50 }
      },
      {
        id: '6c',
        text: 'Small group of 3-4 close friends',
        imageUrl: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&h=300&fit=crop',
        traitScores: { socialPreference: 70, energyLevel: 70, adventureStyle: 60 }
      },
      {
        id: '6d',
        text: 'The more the merrier - big group fun!',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        traitScores: { socialPreference: 95, energyLevel: 90, riskTolerance: 60 }
      }
    ]
  },
  {
    id: 7,
    text: "Pick your dream adventure activity:",
    imageUrl: "https://images.unsplash.com/photo-1533692328991-08159ff19fca?w=800&h=600&fit=crop",
    category: 'riskTolerance',
    options: [
      {
        id: '7a',
        text: 'Skydiving over tropical islands',
        imageUrl: 'https://images.unsplash.com/photo-1601024445121-e5b82f020549?w=400&h=300&fit=crop',
        traitScores: { riskTolerance: 100, adventureStyle: 100, energyLevel: 95 }
      },
      {
        id: '7b',
        text: 'Wine tasting in scenic vineyards',
        imageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=300&fit=crop',
        traitScores: { riskTolerance: 20, socialPreference: 60, energyLevel: 30 }
      },
      {
        id: '7c',
        text: 'Scuba diving with marine life',
        imageUrl: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=300&fit=crop',
        traitScores: { riskTolerance: 70, adventureStyle: 80, energyLevel: 60 }
      },
      {
        id: '7d',
        text: 'Photography walk through old towns',
        imageUrl: 'https://images.unsplash.com/photo-1513759565286-20e9c5fad06b?w=400&h=300&fit=crop',
        traitScores: { riskTolerance: 30, adventureStyle: 40, socialPreference: 30 }
      }
    ]
  },
  {
    id: 8,
    text: "How do you choose your destinations?",
    imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop",
    category: 'adventureStyle',
    options: [
      {
        id: '8a',
        text: 'Spin a globe and point - surprise me!',
        imageUrl: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=400&h=300&fit=crop',
        traitScores: { adventureStyle: 100, riskTolerance: 90, energyLevel: 80 }
      },
      {
        id: '8b',
        text: 'Follow travel blogs and recommendations',
        imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
        traitScores: { adventureStyle: 40, socialPreference: 50, riskTolerance: 30 }
      },
      {
        id: '8c',
        text: 'Places friends have loved',
        imageUrl: 'https://images.unsplash.com/photo-1522199710521-72d69614c702?w=400&h=300&fit=crop',
        traitScores: { socialPreference: 70, adventureStyle: 30, riskTolerance: 20 }
      },
      {
        id: '8d',
        text: 'Off-the-beaten-path hidden gems',
        imageUrl: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400&h=300&fit=crop',
        traitScores: { adventureStyle: 85, riskTolerance: 75, socialPreference: 20 }
      }
    ]
  },
  {
    id: 9,
    text: "Your ideal evening while traveling:",
    imageUrl: "https://images.unsplash.com/photo-1519982714547-54ccfb2c121e?w=800&h=600&fit=crop",
    category: 'energyLevel',
    options: [
      {
        id: '9a',
        text: 'Dancing at local clubs until dawn',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop',
        traitScores: { energyLevel: 100, socialPreference: 90, adventureStyle: 70 }
      },
      {
        id: '9b',
        text: 'Quiet dinner and early rest',
        imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        traitScores: { energyLevel: 20, socialPreference: 30, adventureStyle: 20 }
      },
      {
        id: '9c',
        text: 'Sunset drinks with new friends',
        imageUrl: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop',
        traitScores: { energyLevel: 60, socialPreference: 80, adventureStyle: 50 }
      },
      {
        id: '9d',
        text: 'Night market exploration and street food',
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
        traitScores: { energyLevel: 70, adventureStyle: 75, riskTolerance: 60 }
      }
    ]
  },
  {
    id: 10,
    text: "What's most important in your travel experiences?",
    imageUrl: "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=800&h=600&fit=crop",
    options: [
      {
        id: '10a',
        text: 'Adrenaline-pumping adventures',
        imageUrl: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400&h=300&fit=crop',
        traitScores: { energyLevel: 90, riskTolerance: 95, adventureStyle: 90 }
      },
      {
        id: '10b',
        text: 'Deep cultural connections',
        imageUrl: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=400&h=300&fit=crop',
        traitScores: { socialPreference: 80, adventureStyle: 70, energyLevel: 50 }
      },
      {
        id: '10c',
        text: 'Peace and relaxation',
        imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop',
        traitScores: { energyLevel: 20, riskTolerance: 20, socialPreference: 30 }
      },
      {
        id: '10d',
        text: 'Creating memories with loved ones',
        imageUrl: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&h=300&fit=crop',
        traitScores: { socialPreference: 90, adventureStyle: 50, energyLevel: 60 }
      }
    ]
  }
];