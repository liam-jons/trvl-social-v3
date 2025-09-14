export interface PersonalityDimension {
  min: number;
  max: number;
  label: string;
  description?: string;
}

export interface PersonalityDimensions {
  energyLevel: PersonalityDimension;
  socialPreference: PersonalityDimension;
  adventureStyle: PersonalityDimension;
  riskTolerance: PersonalityDimension;
}

export interface TraitScores {
  energyLevel?: number;
  socialPreference?: number;
  adventureStyle?: number;
  riskTolerance?: number;
}

export interface QuizOption {
  id: string;
  text: string;
  imageUrl?: string;
  traitScores: TraitScores;
}

export interface QuizQuestion {
  id: number;
  text: string;
  imageUrl: string;
  options: QuizOption[];
  category?: keyof PersonalityDimensions;
}

export interface QuizAnswer {
  questionId: number;
  optionId: string;
  traitScores: TraitScores;
}

export interface PersonalityProfile {
  energyLevel: number;
  socialPreference: number;
  adventureStyle: number;
  riskTolerance: number;
  calculatedAt: Date;
  aiDescription?: string;
}

export interface PersonalityAssessment {
  id?: string;
  userId: string;
  profile: PersonalityProfile;
  answers: QuizAnswer[];
  createdAt: Date;
  updatedAt?: Date;
}

export const PERSONALITY_DIMENSIONS: PersonalityDimensions = {
  energyLevel: {
    min: 0,
    max: 100,
    label: 'Energy Level',
    description: 'Your preference for activity intensity and pace'
  },
  socialPreference: {
    min: 0,
    max: 100,
    label: 'Social Preference',
    description: 'Your comfort level with group vs solo activities'
  },
  adventureStyle: {
    min: 0,
    max: 100,
    label: 'Adventure Style',
    description: 'Your openness to new experiences and spontaneity'
  },
  riskTolerance: {
    min: 0,
    max: 100,
    label: 'Risk Tolerance',
    description: 'Your willingness to try challenging activities'
  }
};