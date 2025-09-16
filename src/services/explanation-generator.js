/**
 * AI-Powered Explanation Generator
 * Generates natural language explanations for compatibility scores
 * Integrates with OpenAI or Anthropic APIs with fallback templates
 */
import { COMPATIBILITY_THRESHOLDS, ScoringDimensionType } from '../types/compatibility';
// Configuration
const API_CONFIG = {
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY,
    model: 'claude-3-haiku-20240307',
    maxTokens: 800,
    temperature: 0.7,
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo',
    maxTokens: 800,
    temperature: 0.7,
  },
  timeout: 15000, // 15 seconds
  maxRetries: 2,
  retryDelay: 2000, // 2 seconds
  cacheTimeout: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
};
// Supported languages for multi-language explanations
const SUPPORTED_LANGUAGES = {
  en: { name: 'English', code: 'en' },
  es: { name: 'Spanish', code: 'es' },
  fr: { name: 'French', code: 'fr' },
  de: { name: 'German', code: 'de' },
  it: { name: 'Italian', code: 'it' },
  pt: { name: 'Portuguese', code: 'pt' },
  ja: { name: 'Japanese', code: 'ja' },
  ko: { name: 'Korean', code: 'ko' },
  zh: { name: 'Chinese', code: 'zh' }
};
// Cache key generator for explanations
function generateCacheKey(score, options = {}) {
  const { language = 'en', tone = 'balanced', includeRecommendations = false } = options;
  const dimensionScores = Object.values(score.dimensions || {})
    .map(d => Math.round(d.score || 0))
    .join('_');
  return `explanation_${Math.round(score.overallScore)}_${dimensionScores}_${language}_${tone}_${includeRecommendations}`;
}
// Cache management with compression
const explanationCache = {
  get(key) {
    try {
      const cached = localStorage.getItem(`exp_${key}`);
      if (!cached) return null;
      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > API_CONFIG.cacheTimeout;
      if (isExpired) {
        localStorage.removeItem(`exp_${key}`);
        return null;
      }
      return data;
    } catch (error) {
      console.warn('Explanation cache retrieval error:', error);
      return null;
    }
  },
  set(key, data) {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(`exp_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Explanation cache storage error:', error);
    }
  },
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('exp_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Explanation cache clearing error:', error);
    }
  }
};
// Determine tone based on compatibility score
function determineTone(overallScore) {
  if (overallScore >= COMPATIBILITY_THRESHOLDS.EXCELLENT.min) {
    return 'encouraging';
  } else if (overallScore >= COMPATIBILITY_THRESHOLDS.GOOD.min) {
    return 'positive';
  } else if (overallScore >= COMPATIBILITY_THRESHOLDS.FAIR.min) {
    return 'balanced';
  } else {
    return 'cautionary';
  }
}
// Get compatibility level from score
function getCompatibilityLevel(score) {
  for (const [level, threshold] of Object.entries(COMPATIBILITY_THRESHOLDS)) {
    if (score >= threshold.min && score <= threshold.max) {
      return {
        level: level.toLowerCase(),
        label: threshold.label,
        color: threshold.color
      };
    }
  }
  return {
    level: 'poor',
    label: 'Poor Match',
    color: '#EF4444'
  };
}
// Context aggregation from scoring dimensions
function aggregateContext(compatibilityScore) {
  const { overallScore, dimensions, confidence } = compatibilityScore;
  const context = {
    overallScore,
    confidence,
    level: getCompatibilityLevel(overallScore),
    strengths: [],
    challenges: [],
    dimensionInsights: {}
  };
  // Analyze each dimension
  Object.entries(dimensions || {}).forEach(([dimensionType, dimension]) => {
    const score = dimension.score || 0;
    const weight = dimension.weight || 0;
    const name = dimension.name || dimensionType.replace(/_/g, ' ');
    context.dimensionInsights[dimensionType] = {
      name,
      score,
      weight,
      level: getCompatibilityLevel(score),
      impact: weight * (score / 100) // Weighted impact
    };
    // Categorize as strength or challenge
    if (score >= COMPATIBILITY_THRESHOLDS.GOOD.min) {
      context.strengths.push({
        dimension: name,
        score,
        weight,
        type: dimensionType
      });
    } else if (score <= COMPATIBILITY_THRESHOLDS.FAIR.max) {
      context.challenges.push({
        dimension: name,
        score,
        weight,
        type: dimensionType
      });
    }
  });
  // Sort by weighted impact
  context.strengths.sort((a, b) => (b.weight * b.score) - (a.weight * a.score));
  context.challenges.sort((a, b) => (b.weight * (100 - b.score)) - (a.weight * (100 - a.score)));
  return context;
}
// Create AI prompt for explanation generation
function createExplanationPrompt(context, options = {}) {
  const { language = 'en', tone, includeRecommendations = true } = options;
  const { overallScore, level, strengths, challenges, dimensionInsights } = context;
  const languageName = SUPPORTED_LANGUAGES[language]?.name || 'English';
  const toneAdjustment = tone || determineTone(overallScore);
  const toneInstructions = {
    encouraging: 'Be enthusiastic and focus on the positive aspects. Emphasize opportunities.',
    positive: 'Be optimistic while being realistic about areas for growth.',
    balanced: 'Provide a fair assessment of both strengths and areas for improvement.',
    cautionary: 'Be honest about challenges while remaining constructive and helpful.'
  };
  const dimensionDescriptions = {
    [ScoringDimensionType.PERSONALITY_TRAITS]: 'personality compatibility (communication styles, energy levels, social preferences)',
    [ScoringDimensionType.TRAVEL_PREFERENCES]: 'travel style preferences (adventure level, planning approach, group dynamics)',
    [ScoringDimensionType.EXPERIENCE_LEVEL]: 'travel experience levels and comfort zones',
    [ScoringDimensionType.BUDGET_RANGE]: 'budget expectations and financial flexibility',
    [ScoringDimensionType.ACTIVITY_PREFERENCES]: 'activity interests and travel goals'
  };
  return `You are a travel compatibility expert. Generate a natural, engaging explanation for a compatibility analysis between potential travel companions.
COMPATIBILITY ANALYSIS:
- Overall Score: ${overallScore}/100 (${level.label})
- Confidence Level: ${Math.round(context.confidence * 100)}%
DIMENSION SCORES:
${Object.entries(dimensionInsights).map(([type, insight]) =>
  `- ${insight.name}: ${insight.score}/100 (${dimensionDescriptions[type] || type})`
).join('\n')}
TOP STRENGTHS: ${strengths.slice(0, 3).map(s => `${s.dimension} (${s.score}/100)`).join(', ')}
MAIN CHALLENGES: ${challenges.slice(0, 3).map(c => `${c.dimension} (${c.score}/100)`).join(', ')}
REQUIREMENTS:
- Write in ${languageName}
- Use ${toneAdjustment} tone: ${toneInstructions[toneAdjustment]}
- Write 3-4 paragraphs (150-250 words total)
- Use second person ("You and your travel companion...")
- Focus on practical travel implications
- ${includeRecommendations ? 'Include 2-3 specific recommendations' : 'Focus on analysis without specific recommendations'}
STRUCTURE:
1. Overall compatibility summary with the key insight
2. Highlight the strongest compatibility areas
3. Address main challenges constructively
${includeRecommendations ? '4. Practical recommendations for traveling together' : ''}
Generate a natural, conversational explanation that helps users understand their travel compatibility.`;
}
// Fallback explanation templates by language and tone
const fallbackTemplates = {
  en: {
    excellent: {
      encouraging: "You and your travel companion are an excellent match! Your personalities complement each other beautifully, and you share very similar travel preferences. Your {strongestDimension} compatibility is particularly impressive at {strongestScore}%. This suggests you'll naturally agree on most travel decisions and enjoy each other's company throughout your journey. {recommendations}",
      positive: "Your compatibility analysis shows an outstanding match with your travel companion. You scored {overallScore}% overall, indicating strong alignment in your travel styles and personalities. Your shared approach to {strongestDimension} will make planning and enjoying your trip much smoother. {recommendations}",
      balanced: "With a compatibility score of {overallScore}%, you and your travel companion are well-matched for traveling together. Your {strongestDimension} alignment is excellent, and you show good compatibility across most areas. {recommendations}",
    },
    good: {
      encouraging: "You have a good compatibility with your travel companion! While there might be some differences in {challengeArea}, your strong {strengthArea} compatibility will help you navigate any challenges. Communication will be key to ensuring you both have an amazing trip. {recommendations}",
      positive: "Your {overallScore}% compatibility score indicates a promising travel partnership. You align well in {strengthArea}, which will serve as a strong foundation for your trip. Being aware of differences in {challengeArea} will help you plan better together. {recommendations}",
      balanced: "You show good overall compatibility at {overallScore}%, with particular strength in {strengthArea}. Some differences in {challengeArea} are normal and can actually enhance your travel experience when managed well. {recommendations}",
    },
    fair: {
      balanced: "Your {overallScore}% compatibility suggests you can travel well together with some planning and communication. While you differ in {challengeArea}, your compatibility in {strengthArea} provides a good foundation. Open discussion about expectations will be important. {recommendations}",
      cautionary: "With {overallScore}% compatibility, you and your travel companion have some significant differences, particularly in {challengeArea}. However, your {strengthArea} alignment shows potential. Success will require clear communication and flexibility from both sides. {recommendations}",
    },
    poor: {
      cautionary: "Your {overallScore}% compatibility indicates substantial differences in travel styles and preferences. The biggest challenges appear in {challengeArea}. While your {strengthArea} shows some alignment, traveling together will require significant compromise and very clear communication about expectations. {recommendations}",
      balanced: "With {overallScore}% compatibility, you and your travel companion have quite different approaches to travel. This doesn't mean you can't have a great trip together, but it will require extra planning and open communication about your different needs in {challengeArea}. {recommendations}",
    }
  }
};
// Generate fallback explanation
function generateFallbackExplanation(context, options = {}) {
  const { language = 'en', includeRecommendations = true } = options;
  const { overallScore, level, strengths, challenges } = context;
  const tone = determineTone(overallScore);
  const templates = fallbackTemplates[language] || fallbackTemplates.en;
  const levelTemplates = templates[level.level] || templates.fair;
  const template = levelTemplates[tone] || levelTemplates.balanced || Object.values(levelTemplates)[0];
  // Get strongest areas
  const strongestStrength = strengths[0];
  const biggestChallenge = challenges[0];
  // Generate recommendations based on context
  let recommendations = '';
  if (includeRecommendations) {
    const recs = [];
    if (overallScore >= 80) {
      recs.push('Plan activities that play to both of your strengths');
      recs.push('Trust your instincts when making decisions together');
    } else if (overallScore >= 60) {
      recs.push('Discuss your different preferences openly before the trip');
      recs.push('Plan a mix of activities that appeal to both of you');
    } else {
      recs.push('Set clear expectations and boundaries before traveling');
      recs.push('Build in flexibility for individual preferences');
      recs.push('Consider shorter trips initially to test your travel dynamic');
    }
    recommendations = recs.length > 0 ? `Consider these tips: ${recs.join(', ')}.` : '';
  }
  // Replace template variables
  return template
    .replace(/{overallScore}/g, overallScore)
    .replace(/{strongestDimension}/g, strongestStrength?.dimension || 'travel style')
    .replace(/{strongestScore}/g, strongestStrength?.score || overallScore)
    .replace(/{strengthArea}/g, strongestStrength?.dimension || 'travel compatibility')
    .replace(/{challengeArea}/g, biggestChallenge?.dimension || 'some travel aspects')
    .replace(/{recommendations}/g, recommendations);
}
// Sleep utility for retry delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// Call Anthropic API
async function callAnthropicAPI(prompt, retryCount = 0) {
  const { apiKey, baseUrl, model, maxTokens, temperature } = API_CONFIG.anthropic;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }
  const requestBody = {
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }]
  };
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }
    const data = await response.json();
    return data.content?.[0]?.text || '';
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('API request timeout');
    }
    if (retryCount < API_CONFIG.maxRetries) {
      const delay = API_CONFIG.retryDelay * Math.pow(2, retryCount);
      console.warn(`Anthropic API call failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${API_CONFIG.maxRetries}):`, error.message);
      await sleep(delay);
      return callAnthropicAPI(prompt, retryCount + 1);
    }
    throw error;
  }
}
// Call OpenAI API
async function callOpenAIAPI(prompt, retryCount = 0) {
  const { apiKey, baseUrl, model, maxTokens, temperature } = API_CONFIG.openai;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  const requestBody = {
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }]
  };
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('API request timeout');
    }
    if (retryCount < API_CONFIG.maxRetries) {
      const delay = API_CONFIG.retryDelay * Math.pow(2, retryCount);
      console.warn(`OpenAI API call failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${API_CONFIG.maxRetries}):`, error.message);
      await sleep(delay);
      return callOpenAIAPI(prompt, retryCount + 1);
    }
    throw error;
  }
}
// Main explanation generation function
export async function generateCompatibilityExplanation(compatibilityScore, options = {}) {
  const {
    language = 'en',
    tone,
    includeRecommendations = true,
    provider = 'auto' // 'auto', 'anthropic', 'openai', 'fallback'
  } = options;
  // Validate inputs
  if (!compatibilityScore || typeof compatibilityScore.overallScore !== 'number') {
    throw new Error('Invalid compatibility score provided');
  }
  if (!SUPPORTED_LANGUAGES[language]) {
    console.warn(`Language ${language} not supported, falling back to English`);
    options.language = 'en';
  }
  // Aggregate context from scoring dimensions
  const context = aggregateContext(compatibilityScore);
  const finalTone = tone || determineTone(compatibilityScore.overallScore);
  // Check cache first
  const cacheKey = generateCacheKey(compatibilityScore, { ...options, tone: finalTone });
  const cachedResult = explanationCache.get(cacheKey);
  if (cachedResult) {
    return {
      explanation: cachedResult.explanation,
      metadata: {
        ...cachedResult.metadata,
        source: 'cache',
        generatedAt: cachedResult.generatedAt
      }
    };
  }
  let explanation;
  let source = 'fallback';
  let error = null;
  // Try AI generation unless explicitly requesting fallback
  if (provider !== 'fallback') {
    try {
      const prompt = createExplanationPrompt(context, { language, tone: finalTone, includeRecommendations });
      // Try providers in order of preference
      const providers = provider === 'auto'
        ? ['anthropic', 'openai']
        : [provider];
      for (const providerName of providers) {
        try {
          if (providerName === 'anthropic' && API_CONFIG.anthropic.apiKey) {
            explanation = await callAnthropicAPI(prompt);
            source = 'anthropic';
            break;
          } else if (providerName === 'openai' && API_CONFIG.openai.apiKey) {
            explanation = await callOpenAIAPI(prompt);
            source = 'openai';
            break;
          }
        } catch (providerError) {
          console.warn(`${providerName} provider failed:`, providerError.message);
          error = providerError.message;
          continue;
        }
      }
    } catch (aiError) {
      console.warn('AI explanation generation failed:', aiError.message);
      error = aiError.message;
    }
  }
  // Fall back to template-based generation if AI failed
  if (!explanation) {
    explanation = generateFallbackExplanation(context, { language, includeRecommendations });
    source = 'fallback';
  }
  // Clean up the explanation
  explanation = explanation.trim();
  if (!explanation) {
    explanation = generateFallbackExplanation(context, { language, includeRecommendations });
    source = 'fallback';
  }
  const result = {
    explanation,
    metadata: {
      source,
      provider: source === 'fallback' ? null : source,
      language,
      tone: finalTone,
      overallScore: compatibilityScore.overallScore,
      confidence: compatibilityScore.confidence,
      generatedAt: new Date().toISOString(),
      context: {
        strengths: context.strengths.length,
        challenges: context.challenges.length,
        topStrength: context.strengths[0]?.dimension || null,
        topChallenge: context.challenges[0]?.dimension || null
      },
      error: error
    }
  };
  // Cache the result
  explanationCache.set(cacheKey, {
    explanation: result.explanation,
    metadata: result.metadata,
    generatedAt: result.metadata.generatedAt
  });
  return result;
}
// Batch explanation generation
export async function generateBulkExplanations(compatibilityScores, options = {}) {
  const results = await Promise.allSettled(
    compatibilityScores.map(score => generateCompatibilityExplanation(score, options))
  );
  return results.map((result, index) => ({
    scoreIndex: index,
    success: result.status === 'fulfilled',
    ...result.status === 'fulfilled'
      ? result.value
      : { error: result.reason?.message || 'Unknown error' }
  }));
}
// Utility functions for cache management and configuration
export function clearExplanationCache() {
  explanationCache.clear();
  console.log('Explanation cache cleared');
}
export function getExplanationServiceConfig() {
  return {
    hasAnthropicKey: !!API_CONFIG.anthropic.apiKey,
    hasOpenAIKey: !!API_CONFIG.openai.apiKey,
    supportedLanguages: Object.keys(SUPPORTED_LANGUAGES),
    cacheTimeout: API_CONFIG.cacheTimeout,
    maxRetries: API_CONFIG.maxRetries,
  };
}
export function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}
// Export default service object
export default {
  generateCompatibilityExplanation,
  generateBulkExplanations,
  clearExplanationCache,
  getExplanationServiceConfig,
  getSupportedLanguages,
};