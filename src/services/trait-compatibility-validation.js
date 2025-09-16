/**
 * Simple validation script for trait compatibility matrices
 * Tests core functionality without complex test framework setup
 */

import { TraitCompatibilityMatrix } from './compatibility-scoring-engine.ts';

// console.log('🧪 Testing TraitCompatibilityMatrix...');

// Test social compatibility matrix
// console.log('\n📊 Social Compatibility Tests:');
const identicalSocial = TraitCompatibilityMatrix.calculateTraitCompatibility('social', 75, 75);
const similarSocial = TraitCompatibilityMatrix.calculateTraitCompatibility('social', 70, 75);
const extremeSocial = TraitCompatibilityMatrix.calculateTraitCompatibility('social', 10, 90);

// console.log(`✓ Identical social preferences (75, 75): ${identicalSocial} (expected: 1.0)`);
// console.log(`✓ Similar social preferences (70, 75): ${similarSocial} (expected: 0.85)`);
// console.log(`✓ Extreme social differences (10, 90): ${extremeSocial} (expected: 0.2)`);

// Test adventure compatibility matrix
// console.log('\n🏔️ Adventure Compatibility Tests:');
const identicalAdventure = TraitCompatibilityMatrix.calculateTraitCompatibility('adventure', 50, 50);
const complementaryAdventure = TraitCompatibilityMatrix.calculateTraitCompatibility('adventure', 45, 55);
const extremeAdventure = TraitCompatibilityMatrix.calculateTraitCompatibility('adventure', 10, 90);

// console.log(`✓ Identical adventure styles (50, 50): ${identicalAdventure} (expected: 0.85)`);
// console.log(`✓ Complementary adventure styles (45, 55): ${complementaryAdventure} (expected: 0.9)`);
// console.log(`✓ Extreme adventure differences (10, 90): ${extremeAdventure} (expected: 0.25)`);

// Test planning compatibility matrix
// console.log('\n📋 Planning Compatibility Tests:');
const identicalPlanning = TraitCompatibilityMatrix.calculateTraitCompatibility('planning', 50, 50);
const complementaryPlanning = TraitCompatibilityMatrix.calculateTraitCompatibility('planning', 40, 55);
const extremePlanning = TraitCompatibilityMatrix.calculateTraitCompatibility('planning', 5, 95);

// console.log(`✓ Identical planning styles (50, 50): ${identicalPlanning} (expected: 0.8)`);
// console.log(`✓ Complementary planning styles (40, 55): ${complementaryPlanning} (expected: 0.9)`);
// console.log(`✓ Extreme planning differences (5, 95): ${extremePlanning} (expected: 0.2)`);

// Test risk compatibility with adventure types
// console.log('\n⚡ Risk Compatibility Tests:');
const baseRisk = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 80, 85);
const extremeSportsRisk = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 80, 85, 'extreme-sports');
const wellnessRisk = TraitCompatibilityMatrix.calculateTraitCompatibility('risk', 80, 85, 'wellness-retreat');

// console.log(`✓ Base risk compatibility (80, 85): ${baseRisk}`);
// console.log(`✓ Extreme sports risk compatibility (80, 85): ${extremeSportsRisk} (should be > ${baseRisk})`);
// console.log(`✓ Wellness retreat risk compatibility (80, 85): ${wellnessRisk} (should be < ${baseRisk})`);

// Validation checks
// console.log('\n🔍 Validation Results:');
let allPassed = true;

// Check that adventure complementary scores are higher than identical
if (complementaryAdventure <= identicalAdventure) {
  // console.log('❌ FAIL: Adventure complementary should score higher than identical');
  allPassed = false;
} else {
  // console.log('✅ PASS: Adventure complementary scores higher than identical');
}

// Check that planning complementary scores are higher than identical
if (complementaryPlanning <= identicalPlanning) {
  // console.log('❌ FAIL: Planning complementary should score higher than identical');
  allPassed = false;
} else {
  // console.log('✅ PASS: Planning complementary scores higher than identical');
}

// Check adventure type weighting works
if (extremeSportsRisk <= baseRisk) {
  // console.log('❌ FAIL: Extreme sports should weight risk higher');
  allPassed = false;
} else {
  // console.log('✅ PASS: Extreme sports weights risk higher');
}

if (wellnessRisk >= baseRisk) {
  // console.log('❌ FAIL: Wellness retreat should weight risk lower');
  allPassed = false;
} else {
  // console.log('✅ PASS: Wellness retreat weights risk lower');
}

// Check extreme differences are penalized
if (extremeSocial >= 0.5 || extremeAdventure >= 0.5 || extremePlanning >= 0.5) {
  // console.log('❌ FAIL: Extreme differences should be heavily penalized (<0.5)');
  allPassed = false;
} else {
  // console.log('✅ PASS: Extreme differences are properly penalized');
}

// console.log(allPassed ? '\n🎉 All trait compatibility tests PASSED!' : '\n💥 Some tests FAILED!');

export { TraitCompatibilityMatrix };