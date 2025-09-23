/**
 * Simple validation script for trait compatibility matrices
 * Tests core functionality without complex test framework setup
 */
import { TraitCompatibilityMatrix } from './compatibility-scoring-engine.ts';
// Test social compatibility matrix
const identicalSocial = TraitCompatibilityMatrix.calculateTraitCompatibility('social', 75, 75);
const similarSocial = TraitCompatibilityMatrix.calculateTraitCompatibility('social', 70, 75);
const extremeSocial = TraitCompatibilityMatrix.calculateTraitCompatibility('social', 10, 90);
// Test adventure compatibility matrix
const identicalAdventure = TraitCompatibilityMatrix.calculateTraitCompatibility('adventure', 50, 50);
const complementaryAdventure = TraitCompatibilityMatrix.calculateTraitCompatibility('adventure', 45, 55);
const extremeAdventure = TraitCompatibilityMatrix.calculateTraitCompatibility('adventure', 10, 90);
// Test planning compatibility matrix
const identicalPlanning = TraitCompatibilityMatrix.calculateTraitCompatibility('planning', 50, 50);
const complementaryPlanning = TraitCompatibilityMatrix.calculateTraitCompatibility('planning', 40, 55);
const extremePlanning = TraitCompatibilityMatrix.calculateTraitCompatibility('planning', 5, 95);
// Test risk compatibility with adventure types
const baseRisk = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 80, 85);
const extremeSportsRisk = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 80, 85, 'extreme-sports');
const wellnessRisk = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 80, 85, 'wellness-retreat');
// Validation checks
let allPassed = true;
// Check that adventure complementary scores are higher than identical
if (complementaryAdventure <= identicalAdventure) {
  allPassed = false;
} else {
}
// Check that planning complementary scores are higher than identical
if (complementaryPlanning <= identicalPlanning) {
  allPassed = false;
} else {
}
// Check adventure type weighting works
if (extremeSportsRisk <= baseRisk) {
  allPassed = false;
} else {
}
if (wellnessRisk >= baseRisk) {
  allPassed = false;
} else {
}
// Check extreme differences are penalized
if (extremeSocial >= 0.5 || extremeAdventure >= 0.5 || extremePlanning >= 0.5) {
  allPassed = false;
} else {
}
export { TraitCompatibilityMatrix };