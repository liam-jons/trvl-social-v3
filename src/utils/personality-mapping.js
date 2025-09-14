/**
 * Personality mapping utilities for converting between different trait systems
 * Maps calculator traits (4-trait system) to Big Five traits (database format)
 */

/**
 * Convert calculator traits to Big Five personality traits
 * Based on psychological research correlations between traits
 *
 * @param {Object} calculatorTraits - The 4-trait system from personality calculator
 * @param {number} calculatorTraits.energyLevel - 0-100 scale
 * @param {number} calculatorTraits.socialPreference - 0-100 scale
 * @param {number} calculatorTraits.adventureStyle - 0-100 scale
 * @param {number} calculatorTraits.riskTolerance - 0-100 scale
 * @returns {Object} Big Five traits in 0-1 decimal scale
 */
export function mapCalculatorToBigFive(calculatorTraits) {
  const { energyLevel, socialPreference, adventureStyle, riskTolerance } = calculatorTraits;

  // Validate input traits
  const requiredTraits = ['energyLevel', 'socialPreference', 'adventureStyle', 'riskTolerance'];
  for (const trait of requiredTraits) {
    if (typeof calculatorTraits[trait] !== 'number' || calculatorTraits[trait] < 0 || calculatorTraits[trait] > 100) {
      throw new Error(`Invalid ${trait}: must be a number between 0 and 100`);
    }
  }

  // Convert percentage (0-100) to decimal (0-1) scale
  const toDecimal = (percentage) => Math.round(percentage) / 100;

  // Mapping algorithms based on psychological correlations:

  // Openness to Experience - primarily mapped from adventureStyle
  // High adventure style = high openness, with risk tolerance as secondary factor
  const openness = toDecimal(
    (adventureStyle * 0.7) + (riskTolerance * 0.2) + (energyLevel * 0.1)
  );

  // Conscientiousness - inversely related to spontaneity/risk-taking
  // Lower risk tolerance often indicates higher conscientiousness
  // Higher planning preference (inferred from lower adventure + lower risk) = higher conscientiousness
  const conscientiousness = toDecimal(
    100 - ((riskTolerance * 0.4) + (adventureStyle * 0.3) + ((100 - energyLevel) * 0.3))
  );

  // Extraversion - directly mapped from socialPreference and energyLevel
  // High social preference + high energy = high extraversion
  const extraversion = toDecimal(
    (socialPreference * 0.6) + (energyLevel * 0.4)
  );

  // Agreeableness - related to social cooperation and group harmony
  // High social preference typically indicates higher agreeableness
  // Moderate levels of other traits suggest balance and cooperation
  const agreeableness = toDecimal(
    (socialPreference * 0.5) +
    ((100 - Math.abs(50 - riskTolerance)) * 0.25) + // Moderate risk = higher agreeableness
    ((100 - Math.abs(50 - adventureStyle)) * 0.25)  // Moderate adventure = higher agreeableness
  );

  // Neuroticism - inversely related to risk tolerance and social comfort
  // Lower risk tolerance + lower social preference = higher anxiety/neuroticism
  // High energy without social outlet can indicate restlessness
  const neuroticism = toDecimal(
    ((100 - riskTolerance) * 0.4) +
    ((100 - socialPreference) * 0.3) +
    (Math.abs(energyLevel - 50) * 0.3) // Extreme energy levels can indicate instability
  );

  // Ensure all values are within 0-1 range and properly rounded
  return {
    openness: Math.max(0, Math.min(1, Math.round(openness * 100) / 100)),
    conscientiousness: Math.max(0, Math.min(1, Math.round(conscientiousness * 100) / 100)),
    extraversion: Math.max(0, Math.min(1, Math.round(extraversion * 100) / 100)),
    agreeableness: Math.max(0, Math.min(1, Math.round(agreeableness * 100) / 100)),
    neuroticism: Math.max(0, Math.min(1, Math.round(neuroticism * 100) / 100)),
  };
}

/**
 * Convert Big Five traits back to calculator format
 * Reverse mapping for data retrieval and display
 *
 * @param {Object} bigFiveTraits - Big Five traits in 0-1 decimal scale
 * @returns {Object} Calculator traits in 0-100 percentage scale
 */
export function mapBigFiveToCalculator(bigFiveTraits) {
  const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = bigFiveTraits;

  // Validate input traits
  const requiredTraits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  for (const trait of requiredTraits) {
    if (typeof bigFiveTraits[trait] !== 'number' || bigFiveTraits[trait] < 0 || bigFiveTraits[trait] > 1) {
      throw new Error(`Invalid ${trait}: must be a number between 0 and 1`);
    }
  }

  // Convert decimal (0-1) to percentage (0-100) scale
  const toPercentage = (decimal) => Math.round(decimal * 100);

  // Reverse mapping algorithms:

  // Energy Level - primarily from extraversion
  const energyLevel = toPercentage(
    (extraversion * 0.6) + ((1 - neuroticism) * 0.2) + (openness * 0.2)
  );

  // Social Preference - directly from extraversion and agreeableness
  const socialPreference = toPercentage(
    (extraversion * 0.7) + (agreeableness * 0.3)
  );

  // Adventure Style - primarily from openness
  const adventureStyle = toPercentage(
    (openness * 0.6) + ((1 - conscientiousness) * 0.2) + (extraversion * 0.2)
  );

  // Risk Tolerance - inverse of conscientiousness and neuroticism
  const riskTolerance = toPercentage(
    ((1 - conscientiousness) * 0.4) + ((1 - neuroticism) * 0.3) + (openness * 0.3)
  );

  // Ensure all values are within 0-100 range
  return {
    energyLevel: Math.max(0, Math.min(100, energyLevel)),
    socialPreference: Math.max(0, Math.min(100, socialPreference)),
    adventureStyle: Math.max(0, Math.min(100, adventureStyle)),
    riskTolerance: Math.max(0, Math.min(100, riskTolerance)),
  };
}

/**
 * Map calculator traits to travel preferences enum values
 * Converts numeric traits to categorical preferences for database storage
 *
 * @param {Object} calculatorTraits - The 4-trait system from personality calculator
 * @returns {Object} Travel preferences in database enum format
 */
export function mapToTravelPreferences(calculatorTraits) {
  const { energyLevel, socialPreference, adventureStyle, riskTolerance } = calculatorTraits;

  // Adventure Style mapping
  let adventure_style;
  if (riskTolerance > 75 && energyLevel > 70) {
    adventure_style = 'thrill_seeker';
  } else if (adventureStyle > 70) {
    adventure_style = 'explorer';
  } else if (socialPreference > 70) {
    adventure_style = 'social';
  } else if (adventureStyle > 40) {
    adventure_style = 'cultural';
  } else {
    adventure_style = 'relaxer';
  }

  // Budget Preference mapping (inferred from risk tolerance and adventure style)
  let budget_preference;
  if (riskTolerance > 70 || adventureStyle > 80) {
    budget_preference = 'flexible'; // Adventurous people tend to be flexible with budget
  } else if (riskTolerance < 30) {
    budget_preference = 'luxury'; // Low risk often correlates with comfort preference
  } else if (adventureStyle < 40) {
    budget_preference = 'moderate'; // Conservative adventure style suggests moderate budget
  } else {
    budget_preference = 'budget'; // Default for mid-range profiles
  }

  // Planning Style mapping
  let planning_style;
  if (adventureStyle > 75 && riskTolerance > 70) {
    planning_style = 'spontaneous';
  } else if (adventureStyle > 60) {
    planning_style = 'flexible';
  } else if (adventureStyle < 40 || riskTolerance < 40) {
    planning_style = 'detailed';
  } else {
    planning_style = 'structured';
  }

  // Group Preference mapping
  let group_preference;
  if (socialPreference < 30) {
    group_preference = 'solo';
  } else if (socialPreference < 50) {
    group_preference = 'couple';
  } else if (socialPreference < 75) {
    group_preference = 'small_group';
  } else {
    group_preference = 'large_group';
  }

  return {
    adventure_style,
    budget_preference,
    planning_style,
    group_preference,
  };
}

/**
 * Convert travel preferences back to inferred calculator traits
 * Reverse mapping for data analysis and display
 *
 * @param {Object} travelPreferences - Travel preferences in database enum format
 * @returns {Object} Inferred calculator traits (approximate mapping)
 */
export function mapTravelPreferencesToTraits(travelPreferences) {
  const { adventure_style, budget_preference, planning_style, group_preference } = travelPreferences;

  // Adventure style to traits mapping
  const adventureMapping = {
    thrill_seeker: { energyLevel: 80, adventureStyle: 90, riskTolerance: 95 },
    explorer: { energyLevel: 70, adventureStyle: 85, riskTolerance: 70 },
    cultural: { energyLevel: 60, adventureStyle: 70, riskTolerance: 50 },
    social: { energyLevel: 50, adventureStyle: 60, riskTolerance: 40 },
    relaxer: { energyLevel: 30, adventureStyle: 25, riskTolerance: 20 },
  };

  // Group preference to social mapping
  const socialMapping = {
    solo: 20,
    couple: 40,
    small_group: 65,
    large_group: 85,
  };

  // Planning style adjustments
  const planningAdjustments = {
    spontaneous: { adventureStyle: 15, riskTolerance: 20 },
    flexible: { adventureStyle: 10, riskTolerance: 10 },
    structured: { adventureStyle: -10, riskTolerance: -10 },
    detailed: { adventureStyle: -20, riskTolerance: -20 },
  };

  // Budget preference adjustments
  const budgetAdjustments = {
    budget: { riskTolerance: -5 },
    moderate: { riskTolerance: 0 },
    luxury: { riskTolerance: -15, energyLevel: 5 },
    flexible: { riskTolerance: 10, adventureStyle: 5 },
  };

  // Base traits from adventure style
  const baseTraits = adventureMapping[adventure_style] || adventureMapping.cultural;

  // Apply social preference
  const socialPreference = socialMapping[group_preference] || 50;

  // Apply adjustments
  const planningAdj = planningAdjustments[planning_style] || {};
  const budgetAdj = budgetAdjustments[budget_preference] || {};

  const calculatedTraits = {
    energyLevel: Math.max(0, Math.min(100, (baseTraits.energyLevel + (budgetAdj.energyLevel || 0)))),
    socialPreference: Math.max(0, Math.min(100, socialPreference)),
    adventureStyle: Math.max(0, Math.min(100, (baseTraits.adventureStyle + (planningAdj.adventureStyle || 0) + (budgetAdj.adventureStyle || 0)))),
    riskTolerance: Math.max(0, Math.min(100, (baseTraits.riskTolerance + (planningAdj.riskTolerance || 0) + (budgetAdj.riskTolerance || 0)))),
  };

  return calculatedTraits;
}

/**
 * Create a complete assessment data object for database insertion
 * Combines all mapping functions to prepare data for persistence
 *
 * @param {Object} input - Assessment input data
 * @returns {Object} Complete assessment data ready for database insertion
 */
export function createAssessmentData(input) {
  const { userId, calculatorTraits, personalityType, traitDescriptions, answers, aiDescription } = input;

  // Map calculator traits to Big Five
  const bigFiveTraits = mapCalculatorToBigFive(calculatorTraits);

  // Map calculator traits to travel preferences
  const travelPreferences = mapToTravelPreferences(calculatorTraits);

  // Create assessment data object
  const assessmentData = {
    user_id: userId,
    // Big Five traits
    ...bigFiveTraits,
    // Travel preferences
    ...travelPreferences,
    // Timestamps
    completed_at: new Date(),
    updated_at: new Date(),
  };

  // Create assessment responses for storage
  const assessmentResponses = answers.map((answer, index) => ({
    user_id: userId,
    question_id: answer.questionId,
    question_text: `Question ${answer.questionId}`, // This should come from quiz data
    response_value: 3, // Default middle value - would need actual Likert scale mapping
    response_text: answer.optionId,
  }));

  return {
    assessmentData,
    assessmentResponses,
    metadata: {
      personalityType,
      traitDescriptions,
      aiDescription,
      originalCalculatorTraits: calculatorTraits,
    },
  };
}

/**
 * Reconstruct calculator profile from database data
 * Reverse mapping for displaying assessment results
 *
 * @param {Object} dbAssessment - Assessment data from database
 * @returns {Object} Calculator-compatible personality profile
 */
export function reconstructCalculatorProfile(dbAssessment) {
  const {
    openness,
    conscientiousness,
    extraversion,
    agreeableness,
    neuroticism,
    adventure_style,
    budget_preference,
    planning_style,
    group_preference,
    completed_at,
    updated_at,
  } = dbAssessment;

  // Map Big Five back to calculator traits
  const calculatorTraits = mapBigFiveToCalculator({
    openness,
    conscientiousness,
    extraversion,
    agreeableness,
    neuroticism,
  });

  // Also get inferred traits from travel preferences as validation
  const inferredTraits = mapTravelPreferencesToTraits({
    adventure_style,
    budget_preference,
    planning_style,
    group_preference,
  });

  return {
    // Primary traits (from Big Five mapping)
    energyLevel: calculatorTraits.energyLevel,
    socialPreference: calculatorTraits.socialPreference,
    adventureStyle: calculatorTraits.adventureStyle,
    riskTolerance: calculatorTraits.riskTolerance,

    // Travel preferences
    travelPreferences: {
      adventureStyle: adventure_style,
      budgetPreference: budget_preference,
      planningStyle: planning_style,
      groupPreference: group_preference,
    },

    // Metadata
    calculatedAt: new Date(completed_at),
    updatedAt: updated_at ? new Date(updated_at) : null,

    // Validation data (for debugging/analysis)
    inferredTraits,
    bigFiveSource: {
      openness,
      conscientiousness,
      extraversion,
      agreeableness,
      neuroticism,
    },
  };
}

export default {
  mapCalculatorToBigFive,
  mapBigFiveToCalculator,
  mapToTravelPreferences,
  mapTravelPreferencesToTraits,
  createAssessmentData,
  reconstructCalculatorProfile,
};