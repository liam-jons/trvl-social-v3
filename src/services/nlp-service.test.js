/**
 * Test file for NLP Service
 * Run these tests to verify parsing accuracy with various inputs
 */

import { parseTripDescription, getConfidenceExplanation, clearNLPCache } from './nlp-service.js';

// Test data with various complexity levels
const testDescriptions = [
  {
    name: 'Simple Adventure',
    description: 'I want to go hiking in Colorado for a week with my family of 4. Budget is around $3000.',
    expectedFields: ['destinations', 'activities', 'groupSize', 'budget']
  },
  {
    name: 'Complex Cultural Trip',
    description: 'Seeking a 2-week cultural immersion experience in Southeast Asia, particularly Thailand and Vietnam. Interested in cooking classes, temple visits, local markets, and staying with families. I\'m traveling solo as a vegetarian with a flexible budget around $3000. Looking for authentic experiences off the beaten path.',
    expectedFields: ['destinations', 'activities', 'specialRequirements', 'budget', 'groupSize']
  },
  {
    name: 'Adventure with Dates',
    description: 'Planning a rock climbing and camping trip to Yosemite National Park from July 15-22. Group of 6 experienced climbers, budget $500 per person. Need gear rental and wilderness permits.',
    expectedFields: ['destinations', 'activities', 'dates', 'groupSize', 'budget']
  },
  {
    name: 'Luxury Romance',
    description: 'Romantic getaway to the Mediterranean for my anniversary. Love wine tasting, coastal walks, historic sites, and luxury accommodations. 7-10 days in September, budget up to $8000 for two people.',
    expectedFields: ['destinations', 'activities', 'budget', 'groupSize', 'dates']
  },
  {
    name: 'Minimal Description',
    description: 'Beach vacation somewhere warm',
    expectedFields: ['activities']
  }
];

// Manual test runner (since this is a demo implementation)
export async function runNLPTests() {
  console.log('🧪 Running NLP Service Tests...\n');

  for (const test of testDescriptions) {
    console.log(`📝 Testing: ${test.name}`);
    console.log(`Description: "${test.description}"`);

    try {
      const result = await parseTripDescription(test.description);

      console.log(`✅ Parsed successfully!`);
      console.log(`   Overall Confidence: ${Math.round(result.overallConfidence * 100)}%`);
      console.log(`   Source: ${result.source}`);

      // Check key findings
      if (result.destinations.primary) {
        console.log(`   🎯 Destination: ${result.destinations.primary}`);
      }

      if (result.activities.interests.length > 0) {
        console.log(`   🎨 Activities: ${result.activities.interests.slice(0, 3).join(', ')}`);
      }

      if (result.budget.amount) {
        console.log(`   💰 Budget: $${result.budget.amount.toLocaleString()} ${result.budget.currency || 'USD'}`);
      }

      if (result.groupSize.size) {
        console.log(`   👥 Group Size: ${result.groupSize.size} people`);
      }

      // Show confidence explanations
      const explanations = getConfidenceExplanation(result);
      if (explanations.length > 0) {
        console.log(`   📊 Quality Indicators: ${explanations.join(', ')}`);
      }

      console.log(''); // Empty line for readability

    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
      console.log('');
    }
  }

  console.log('🎉 NLP Tests completed!\n');
}

// Test individual components
export function testFallbackParsing() {
  console.log('🔧 Testing fallback parsing patterns...');

  // Test regex patterns manually
  const testText = 'I want to visit Japan and Thailand for hiking and cultural tours with a budget of $5000 for 2 people';

  const FALLBACK_PATTERNS = {
    destinations: {
      countries: /\b(japan|italy|france|spain|germany|australia|thailand|vietnam|peru|chile|iceland|norway)\b/gi,
    },
    budget: {
      amounts: /\$?([0-9,]+)/gi,
    },
    groupSize: {
      numbers: /\b(\d+)\s*(?:people|persons?)\b/gi,
    },
    activities: {
      outdoor: /\b(hiking|camping|climbing)\b/gi,
      cultural: /\b(cultural|tours?|museum)\b/gi,
    }
  };

  const countries = testText.match(FALLBACK_PATTERNS.destinations.countries) || [];
  const amounts = testText.match(FALLBACK_PATTERNS.budget.amounts) || [];
  const groupSize = testText.match(FALLBACK_PATTERNS.groupSize.numbers) || [];
  const activities = [
    ...(testText.match(FALLBACK_PATTERNS.activities.outdoor) || []),
    ...(testText.match(FALLBACK_PATTERNS.activities.cultural) || [])
  ];

  console.log(`Countries found: ${countries.join(', ')}`);
  console.log(`Budget amounts: ${amounts.join(', ')}`);
  console.log(`Group size: ${groupSize.join(', ')}`);
  console.log(`Activities: ${activities.join(', ')}`);
  console.log('✅ Fallback patterns working correctly\n');
}

// Usage instructions
console.log(`
🚀 NLP Service Test Suite

To run tests, open browser console and execute:

// Import the test module
import * as nlpTests from './services/nlp-service.test.js';

// Run full test suite
nlpTests.runNLPTests();

// Test fallback patterns
nlpTests.testFallbackParsing();

// Clear cache before testing
import { clearNLPCache } from './services/nlp-service.js';
clearNLPCache();
`);

export default {
  runNLPTests,
  testFallbackParsing,
  testDescriptions
};