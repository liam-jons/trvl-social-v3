/**
 * AI API Service for generating personality descriptions
 * Uses Anthropic Claude API with fallback to static descriptions
 */

// Configuration
const API_CONFIG = {
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY,
    model: 'claude-3-haiku-20240307', // Fast and cost-effective for description generation
    maxTokens: 500,
    temperature: 0.7,
  },
  timeout: 10000, // 10 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second, with exponential backoff
  cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// Cache key generator for personality profiles
function generateCacheKey(profile) {
  const { energyLevel, socialPreference, adventureStyle, riskTolerance, personalityType } = profile;
  return `ai_desc_${energyLevel}_${socialPreference}_${adventureStyle}_${riskTolerance}_${personalityType}`;
}

// Cache management
const cache = {
  get(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > API_CONFIG.cacheTimeout;

      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Cache retrieval error:', error);
      return null;
    }
  },

  set(key, data) {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Cache storage error:', error);
    }
  },

  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('ai_desc_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache clearing error:', error);
    }
  }
};

// Prompt template for personality descriptions
function createPrompt(profile) {
  const { energyLevel, socialPreference, adventureStyle, riskTolerance, personalityType } = profile;

  return `You are a travel personality expert. Generate natural, engaging descriptions for a traveler's personality traits based on their quiz results.

Traveler Profile:
- Personality Type: ${personalityType}
- Energy Level: ${energyLevel}/100 (low=relaxed pace, high=active/energetic)
- Social Preference: ${socialPreference}/100 (low=solo travel, high=group activities)
- Adventure Style: ${adventureStyle}/100 (low=comfort/familiar, high=exploration/unique)
- Risk Tolerance: ${riskTolerance}/100 (low=safety first, high=thrill-seeking)

Generate 4 personalized trait descriptions (2-3 sentences each) that:
- Are written in second person ("You...")
- Sound natural and engaging, not clinical
- Focus on travel behaviors and preferences
- Are specific to the numeric scores provided
- Avoid generic phrases

Format as JSON:
{
  "energyLevel": "Description for energy level trait...",
  "socialPreference": "Description for social preference trait...",
  "adventureStyle": "Description for adventure style trait...",
  "riskTolerance": "Description for risk tolerance trait..."
}`;
}

// Fallback descriptions (from existing personality calculator)
function getFallbackDescriptions(profile) {
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

// Sleep utility for retry delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Make API call to Anthropic Claude
async function callAnthropicAPI(prompt, retryCount = 0) {
  const { apiKey, baseUrl, model, maxTokens, temperature } = API_CONFIG.anthropic;

  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const requestBody = {
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
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
      throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid API response format');
    }

    return data.content[0].text;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('API request timeout');
    }

    // Retry logic with exponential backoff
    if (retryCount < API_CONFIG.maxRetries) {
      const delay = API_CONFIG.retryDelay * Math.pow(2, retryCount);
      console.warn(`AI API call failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${API_CONFIG.maxRetries}):`, error.message);

      await sleep(delay);
      return callAnthropicAPI(prompt, retryCount + 1);
    }

    throw error;
  }
}

// Parse AI response and validate format
function parseAIResponse(responseText) {
  try {
    // Try to extract JSON from response if it contains other text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : responseText;

    const parsed = JSON.parse(jsonText);

    // Validate required fields
    const requiredFields = ['energyLevel', 'socialPreference', 'adventureStyle', 'riskTolerance'];
    const missingFields = requiredFields.filter(field => !parsed[field] || typeof parsed[field] !== 'string');

    if (missingFields.length > 0) {
      throw new Error(`Missing or invalid fields in AI response: ${missingFields.join(', ')}`);
    }

    // Trim descriptions and validate length
    const descriptions = {};
    requiredFields.forEach(field => {
      const description = parsed[field].trim();
      if (description.length < 10) {
        throw new Error(`Description for ${field} is too short`);
      }
      descriptions[field] = description;
    });

    return descriptions;
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

// Main function to generate AI-enhanced personality descriptions
export async function generatePersonalityDescriptions(profile) {
  if (!profile || typeof profile !== 'object') {
    throw new Error('Invalid personality profile provided');
  }

  const { energyLevel, socialPreference, adventureStyle, riskTolerance, personalityType } = profile;

  // Validate required fields
  const requiredFields = { energyLevel, socialPreference, adventureStyle, riskTolerance, personalityType };
  const missingFields = Object.entries(requiredFields).filter(([key, value]) =>
    value === undefined || value === null || (key !== 'personalityType' && typeof value !== 'number')
  );

  if (missingFields.length > 0) {
    throw new Error(`Missing required profile fields: ${missingFields.map(([key]) => key).join(', ')}`);
  }

  // Check cache first
  const cacheKey = generateCacheKey(profile);
  const cachedResult = cache.get(cacheKey);

  if (cachedResult) {
    console.log('Returning cached personality descriptions');
    return {
      descriptions: cachedResult,
      source: 'cache'
    };
  }

  // Try AI generation
  try {
    console.log('Generating AI-powered personality descriptions');
    const prompt = createPrompt(profile);
    const aiResponse = await callAnthropicAPI(prompt);
    const descriptions = parseAIResponse(aiResponse);

    // Cache successful result
    cache.set(cacheKey, descriptions);

    return {
      descriptions,
      source: 'ai'
    };
  } catch (error) {
    console.warn('AI description generation failed, using fallback:', error.message);

    // Return fallback descriptions
    const fallbackDescriptions = getFallbackDescriptions(profile);

    return {
      descriptions: fallbackDescriptions,
      source: 'fallback',
      error: error.message
    };
  }
}

// Utility function to clear AI description cache
export function clearDescriptionCache() {
  cache.clear();
  console.log('AI description cache cleared');
}

// Configuration getter for debugging
export function getAIServiceConfig() {
  return {
    hasApiKey: !!API_CONFIG.anthropic.apiKey,
    model: API_CONFIG.anthropic.model,
    cacheTimeout: API_CONFIG.cacheTimeout,
    maxRetries: API_CONFIG.maxRetries,
  };
}

export default {
  generatePersonalityDescriptions,
  clearDescriptionCache,
  getAIServiceConfig,
};