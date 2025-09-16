import { PERSONALITY_DIMENSIONS } from '../types/personality';
import { generatePersonalityDescriptions } from '../services/ai-service.js';
/**
 * Calculate personality profile from quiz answers
 * @param {Array} answers - Array of quiz answers with trait scores
 * @param {Object} options - Options for profile calculation
 * @param {boolean} options.useAI - Whether to use AI for description generation (default: true)
 * @returns {Object} Calculated personality profile
 */
export async function calculatePersonalityProfile(answers, options = { useAI: true }) {
  if (!answers || answers.length === 0) {
    throw new Error('No answers provided for calculation');
  }
  // Initialize trait totals and counts
  const traitTotals = {
    energyLevel: 0,
    socialPreference: 0,
    adventureStyle: 0,
    riskTolerance: 0
  };
  const traitCounts = {
    energyLevel: 0,
    socialPreference: 0,
    adventureStyle: 0,
    riskTolerance: 0
  };
  // Aggregate trait scores from all answers
  answers.forEach(answer => {
    if (answer.traitScores) {
      Object.entries(answer.traitScores).forEach(([trait, score]) => {
        if (traitTotals.hasOwnProperty(trait) && typeof score === 'number') {
          traitTotals[trait] += score;
          traitCounts[trait] += 1;
        }
      });
    }
  });
  // Calculate average scores for each trait
  const averageScores = {};
  Object.keys(traitTotals).forEach(trait => {
    if (traitCounts[trait] > 0) {
      averageScores[trait] = traitTotals[trait] / traitCounts[trait];
    } else {
      // Default to middle value if no data for this trait
      averageScores[trait] = 50;
    }
  });
  // Normalize scores to 0-100 range
  const normalizedScores = normalizeScores(averageScores);
  // Apply weights based on question frequency
  const weightedScores = applyWeights(normalizedScores, traitCounts, answers.length);
  // Generate personality profile
  const profile = {
    energyLevel: Math.round(weightedScores.energyLevel),
    socialPreference: Math.round(weightedScores.socialPreference),
    adventureStyle: Math.round(weightedScores.adventureStyle),
    riskTolerance: Math.round(weightedScores.riskTolerance),
    calculatedAt: new Date(),
    totalQuestions: answers.length,
    answeredQuestions: answers.filter(a => a.traitScores).length
  };
  // Add personality type classification
  profile.personalityType = classifyPersonalityType(profile);
  // Add trait descriptions using AI or fallback
  try {
    if (options.useAI) {
      const aiResult = await generatePersonalityDescriptions(profile);
      profile.traitDescriptions = aiResult.descriptions;
      profile.descriptionSource = aiResult.source;
      if (aiResult.error) {
        profile.descriptionError = aiResult.error;
      }
    } else {
      profile.traitDescriptions = generateTraitDescriptions(profile);
      profile.descriptionSource = 'static';
    }
  } catch (error) {
    console.warn('Failed to generate AI descriptions, using fallback:', error.message);
    profile.traitDescriptions = generateTraitDescriptions(profile);
    profile.descriptionSource = 'fallback';
    profile.descriptionError = error.message;
  }
  return profile;
}
/**
 * Normalize scores to ensure they're within 0-100 range
 * @param {Object} scores - Raw trait scores
 * @returns {Object} Normalized scores
 */
function normalizeScores(scores) {
  const normalized = {};
  Object.entries(scores).forEach(([trait, score]) => {
    const dimension = PERSONALITY_DIMENSIONS[trait];
    if (dimension) {
      // Clamp score between min and max
      const clamped = Math.max(dimension.min, Math.min(dimension.max, score));
      // Normalize to 0-100 range
      normalized[trait] = ((clamped - dimension.min) / (dimension.max - dimension.min)) * 100;
    } else {
      normalized[trait] = score;
    }
  });
  return normalized;
}
/**
 * Apply weights based on how many questions contributed to each trait
 * @param {Object} scores - Normalized trait scores
 * @param {Object} counts - Count of questions per trait
 * @param {number} totalQuestions - Total number of questions
 * @returns {Object} Weighted scores
 */
function applyWeights(scores, counts, totalQuestions) {
  const weighted = {};
  Object.entries(scores).forEach(([trait, score]) => {
    const questionWeight = counts[trait] / totalQuestions;
    // If trait was measured by fewer questions, reduce confidence
    // but don't completely nullify the score
    const confidenceFactor = Math.min(1, (counts[trait] / 3) + 0.5);
    // Apply confidence factor to move score toward middle (50)
    weighted[trait] = score * confidenceFactor + 50 * (1 - confidenceFactor);
  });
  return weighted;
}
/**
 * Classify personality into a type based on trait scores
 * @param {Object} profile - Calculated personality profile
 * @returns {string} Personality type label
 */
function classifyPersonalityType(profile) {
  const { energyLevel, socialPreference, adventureStyle, riskTolerance } = profile;
  // High energy + High social + High adventure + High risk = "The Thrill Seeker"
  if (energyLevel > 70 && socialPreference > 70 && adventureStyle > 70 && riskTolerance > 70) {
    return 'The Thrill Seeker';
  }
  // Low energy + Low social + Low adventure + Low risk = "The Comfort Traveler"
  if (energyLevel < 40 && socialPreference < 40 && adventureStyle < 40 && riskTolerance < 40) {
    return 'The Comfort Traveler';
  }
  // High energy + Low social + High adventure = "The Solo Explorer"
  if (energyLevel > 60 && socialPreference < 40 && adventureStyle > 60) {
    return 'The Solo Explorer';
  }
  // Low energy + High social + Moderate adventure = "The Social Butterfly"
  if (energyLevel < 50 && socialPreference > 70 && adventureStyle > 40 && adventureStyle < 70) {
    return 'The Social Butterfly';
  }
  // High adventure + High risk + Moderate energy = "The Adventurer"
  if (adventureStyle > 70 && riskTolerance > 70 && energyLevel > 50) {
    return 'The Adventurer';
  }
  // High social + Low risk + Moderate energy = "The Group Planner"
  if (socialPreference > 70 && riskTolerance < 40 && energyLevel > 40 && energyLevel < 70) {
    return 'The Group Planner';
  }
  // Moderate everything = "The Balanced Wanderer"
  if (
    energyLevel > 40 && energyLevel < 70 &&
    socialPreference > 40 && socialPreference < 70 &&
    adventureStyle > 40 && adventureStyle < 70 &&
    riskTolerance > 40 && riskTolerance < 70
  ) {
    return 'The Balanced Wanderer';
  }
  // High energy + High adventure + Low social = "The Active Soloist"
  if (energyLevel > 70 && adventureStyle > 70 && socialPreference < 40) {
    return 'The Active Soloist';
  }
  // Low energy + High social + Low risk = "The Leisure Socializer"
  if (energyLevel < 40 && socialPreference > 60 && riskTolerance < 40) {
    return 'The Leisure Socializer';
  }
  // Default fallback
  return 'The Curious Traveler';
}
/**
 * Generate descriptive text for each trait level
 * @param {Object} profile - Calculated personality profile
 * @returns {Object} Trait descriptions
 */
function generateTraitDescriptions(profile) {
  const descriptions = {};
  // Energy Level description
  if (profile.energyLevel > 70) {
    descriptions.energyLevel = 'You thrive on high-energy activities and packed itineraries';
  } else if (profile.energyLevel > 40) {
    descriptions.energyLevel = 'You enjoy a balanced mix of activity and relaxation';
  } else {
    descriptions.energyLevel = 'You prefer a relaxed pace with plenty of downtime';
  }
  // Social Preference description
  if (profile.socialPreference > 70) {
    descriptions.socialPreference = 'You love traveling with groups and meeting new people';
  } else if (profile.socialPreference > 40) {
    descriptions.socialPreference = 'You enjoy both social activities and personal time';
  } else {
    descriptions.socialPreference = 'You prefer solo adventures or intimate travel experiences';
  }
  // Adventure Style description
  if (profile.adventureStyle > 70) {
    descriptions.adventureStyle = 'You seek out unique, off-the-beaten-path experiences';
  } else if (profile.adventureStyle > 40) {
    descriptions.adventureStyle = 'You balance familiar comforts with new discoveries';
  } else {
    descriptions.adventureStyle = 'You prefer well-planned, comfortable travel experiences';
  }
  // Risk Tolerance description
  if (profile.riskTolerance > 70) {
    descriptions.riskTolerance = 'You embrace challenges and thrive on adrenaline';
  } else if (profile.riskTolerance > 40) {
    descriptions.riskTolerance = 'You enjoy occasional thrills with reasonable safety';
  } else {
    descriptions.riskTolerance = 'You prioritize safety and predictability in your travels';
  }
  return descriptions;
}
/**
 * Validate quiz answers format
 * @param {Array} answers - Array of quiz answers
 * @returns {boolean} True if valid
 */
export function validateAnswers(answers) {
  if (!Array.isArray(answers)) {
    return false;
  }
  return answers.every(answer =>
    answer &&
    typeof answer.questionId === 'number' &&
    typeof answer.optionId === 'string' &&
    typeof answer.traitScores === 'object'
  );
}
/**
 * Calculate completion percentage
 * @param {Array} answers - Array of quiz answers
 * @param {number} totalQuestions - Total number of questions
 * @returns {number} Completion percentage
 */
export function calculateCompletionPercentage(answers, totalQuestions) {
  if (!answers || totalQuestions === 0) {
    return 0;
  }
  const answeredCount = answers.filter(a => a && a.traitScores).length;
  return Math.round((answeredCount / totalQuestions) * 100);
}