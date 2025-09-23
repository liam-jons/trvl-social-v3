/**
 * Standalone validation of trait compatibility matrices
 * Tests the core logic without TypeScript dependencies
 */
// Extracted TraitCompatibilityMatrix logic for validation
class TraitCompatibilityMatrix {
  // Social compatibility matrix
  static calculateSocialCompatibility(level1, level2) {
    const diff = Math.abs(level1 - level2);
    if (diff <= 10) return 1.0;        // Excellent match - very similar
    if (diff <= 25) return 0.85;       // Good match - minor differences
    if (diff <= 40) return 0.65;       // Fair match - moderate differences
    if (diff <= 60) return 0.4;        // Challenging match - significant differences
    return 0.2;                        // Poor match - extreme differences
  }
  // Adventure compatibility matrix
  static calculateAdventureCompatibility(style1, style2) {
    const diff = Math.abs(style1 - style2);
    if (diff <= 5) return 0.85;        // Similar but not identical
    if (diff <= 15) return 0.9;        // Optimal complementary difference
    if (diff <= 30) return 0.75;       // Moderate difference - manageable
    if (diff <= 50) return 0.5;        // Significant difference - requires compromise
    return 0.25;                       // Extreme difference - potential conflicts
  }
  // Planning compatibility matrix
  static calculatePlanningCompatibility(planning1, planning2) {
    const diff = Math.abs(planning1 - planning2);
    if (diff <= 8) return 0.8;         // Very similar planning styles
    if (diff <= 20) return 0.9;        // Complementary planning approaches
    if (diff <= 35) return 0.7;        // Moderate differences
    if (diff <= 55) return 0.45;       // Major differences require communication
    return 0.2;                        // Extreme differences - high conflict potential
  }
  // Adventure type weights
  static getAdventureTypeWeight(adventureType, dimension) {
    if (!adventureType) return 1.0;
    const weights = {
      'extreme-sports': { risk: 1.3, adventure: 1.2, planning: 0.9, social: 1.0 },
      'cultural-immersion': { risk: 0.8, adventure: 0.9, planning: 1.2, social: 1.1 },
      'luxury-travel': { risk: 0.7, adventure: 0.8, planning: 1.3, social: 1.0 },
      'budget-backpacking': { risk: 1.1, adventure: 1.1, planning: 0.8, social: 1.2 },
      'family-friendly': { risk: 0.6, adventure: 0.7, planning: 1.4, social: 1.0 },
      'wellness-retreat': { risk: 0.5, adventure: 0.6, planning: 1.1, social: 0.9 }
    };
    return weights[adventureType]?.[dimension] || 1.0;
  }
  // Risk compatibility with adventure type weighting
  static calculateRiskCompatibility(risk1, risk2, adventureType) {
    const diff = Math.abs(risk1 - risk2);
    let baseScore;
    if (diff <= 10) baseScore = 0.95;       // Excellent alignment
    else if (diff <= 25) baseScore = 0.8;   // Good alignment
    else if (diff <= 40) baseScore = 0.6;   // Fair alignment
    else if (diff <= 60) baseScore = 0.35;  // Poor alignment
    else baseScore = 0.15;                  // Very poor alignment
    // Apply adventure type weighting
    const adventureWeight = this.getAdventureTypeWeight(adventureType, 'risk');
    return baseScore * adventureWeight;
  }
  static calculateTraitCompatibility(trait, value1, value2, adventureType) {
    switch (trait) {
      case 'social':
        return this.calculateSocialCompatibility(value1, value2);
      case 'adventure':
        return this.calculateAdventureCompatibility(value1, value2);
      case 'planning':
        return this.calculatePlanningCompatibility(value1, value2);
      case 'risk':
        return this.calculateRiskCompatibility(value1, value2, adventureType);
      default:
        return 0.5; // Default neutral score
    }
  }
}
// Test social compatibility
const tests = [
  { name: 'Identical introverts', input: [20, 20], expected: 1.0 },
  { name: 'Similar introverts', input: [15, 25], expected: 0.85 },
  { name: 'Introvert vs extrovert', input: [20, 80], expected: 0.4 },
  { name: 'Extreme mismatch', input: [10, 90], expected: 0.2 }
];
tests.forEach(test => {
  const result = TraitCompatibilityMatrix.calculateTraitCompatibility('social', test.input[0], test.input[1]);
});
// Test adventure compatibility
const adventureTests = [
  { name: 'Nearly identical', input: [50, 52], expected: 0.85 },
  { name: 'Optimal difference', input: [45, 55], expected: 0.9 },
  { name: 'Moderate difference', input: [40, 65], expected: 0.75 },
  { name: 'Extreme difference', input: [10, 80], expected: 0.25 }
];
adventureTests.forEach(test => {
  const result = TraitCompatibilityMatrix.calculateTraitCompatibility('adventure', test.input[0], test.input[1]);
});
// Test planning compatibility
const planningTests = [
  { name: 'Very similar', input: [50, 55], expected: 0.8 },
  { name: 'Complementary', input: [40, 55], expected: 0.9 },
  { name: 'Moderate difference', input: [30, 60], expected: 0.7 },
  { name: 'Extreme difference', input: [5, 95], expected: 0.2 }
];
planningTests.forEach(test => {
  const result = TraitCompatibilityMatrix.calculateTraitCompatibility('planning', test.input[0], test.input[1]);
});
// Test risk compatibility with adventure types
const baseRisk = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 80, 85);
const extremeSportsRisk = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 80, 85, 'extreme-sports');
const wellnessRisk = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 80, 85, 'wellness-retreat');
// Test adventure type weights
const weightTests = [
  { type: 'extreme-sports', dimension: 'risk', expected: 1.3 },
  { type: 'luxury-travel', dimension: 'planning', expected: 1.3 },
  { type: 'family-friendly', dimension: 'risk', expected: 0.6 },
  { type: 'unknown-type', dimension: 'risk', expected: 1.0 }
];
weightTests.forEach(test => {
  const result = TraitCompatibilityMatrix.getAdventureTypeWeight(test.type, test.dimension);
});
// Test key behavioral patterns
// 1. Adventure complementarity should beat identical matches
const adventureIdentical = TraitCompatibilityMatrix.calculateTraitCompatibility('adventure', 50, 50);
const adventureComplementary = TraitCompatibilityMatrix.calculateTraitCompatibility('adventure', 45, 55);
// 2. Planning complementarity should beat identical matches
const planningIdentical = TraitCompatibilityMatrix.calculateTraitCompatibility('planning', 50, 50);
const planningComplementary = TraitCompatibilityMatrix.calculateTraitCompatibility('planning', 42, 58);
// 3. Extreme differences should be heavily penalized
const extremeTests = [
  TraitCompatibilityMatrix.calculateTraitCompatibility('social', 10, 90),
  TraitCompatibilityMatrix.calculateTraitCompatibility('adventure', 5, 95),
  TraitCompatibilityMatrix.calculateTraitCompatibility('planning', 0, 100),
  TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 10, 90)
];
const allExtremesLow = extremeTests.every(score => score < 0.3);
// 4. Adventure type weighting works correctly
const riskWeightingWorks = extremeSportsRisk > baseRisk && wellnessRisk < baseRisk;
