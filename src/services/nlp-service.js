import sentryService from './sentry-service.js';
/**
 * Natural Language Processing Service for Trip Request Parsing
 * Uses OpenAI API with fallback to Anthropic Claude and regex patterns
 */

// Configuration
const API_CONFIG = {
  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo', // Cost-effective for parsing tasks
    maxTokens: 800,
    temperature: 0.1, // Low temperature for consistent structured output
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY,
    model: 'claude-3-haiku-20240307',
    maxTokens: 800,
    temperature: 0.1,
  },
  timeout: 15000, // 15 seconds for complex parsing
  maxRetries: 2,
  retryDelay: 1000,
  cacheTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days for parsed trips
};

// Generate cache key based on trip description
function generateCacheKey(description) {
  // Create a hash-like key from the description
  const normalized = description.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const hash = normalized.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff;
  }, 0);
  return `nlp_parse_${Math.abs(hash)}`;
}

// Cache management with localStorage
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
      // console.warn('NLP cache retrieval error:', error);
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
      // console.warn('NLP cache storage error:', error);
    }
  },

  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('nlp_parse_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      // console.warn('NLP cache clearing error:', error);
    }
  }
};

// Prompt template for trip parsing
function createParsingPrompt(description) {
  return `You are an expert travel agent. Parse the following trip description and extract structured information. Be as accurate as possible and indicate confidence levels.

Trip Description:
"${description}"

Extract the following information and return as valid JSON:

{
  "destinations": {
    "primary": "Main destination (city, region, or country)",
    "secondary": ["Additional locations mentioned"],
    "confidence": 0.9
  },
  "dates": {
    "startDate": "YYYY-MM-DD or null if not specified",
    "endDate": "YYYY-MM-DD or null if not specified",
    "duration": "Number of days or null",
    "flexibility": "flexible/fixed/approximate",
    "confidence": 0.8
  },
  "budget": {
    "amount": "Numeric value or null",
    "currency": "USD/EUR/GBP etc or null",
    "perPerson": true,
    "range": {
      "min": "Minimum budget or null",
      "max": "Maximum budget or null"
    },
    "confidence": 0.7
  },
  "groupSize": {
    "size": "Number of people or null",
    "type": "solo/couple/family/friends/group",
    "ageGroups": ["adults", "children", "teens"],
    "confidence": 0.9
  },
  "activities": {
    "interests": ["List of activities/interests mentioned"],
    "adventureLevel": "relaxed/moderate/adventurous/extreme",
    "categories": ["outdoor", "cultural", "culinary", "nightlife", "wellness"],
    "confidence": 0.8
  },
  "accommodation": {
    "type": "hotel/hostel/airbnb/camping/luxury/budget",
    "preferences": ["List of accommodation preferences"],
    "confidence": 0.6
  },
  "transportation": {
    "preferences": ["flight", "car", "train", "bus"],
    "confidence": 0.5
  },
  "specialRequirements": {
    "dietary": ["List of dietary restrictions"],
    "accessibility": ["List of accessibility needs"],
    "other": ["Any other special requirements"],
    "confidence": 0.7
  },
  "tripStyle": {
    "pace": "slow/moderate/fast",
    "planning": "spontaneous/flexible/structured",
    "socialLevel": "solo/intimate/social/party",
    "confidence": 0.8
  },
  "overallConfidence": 0.8
}

Important:
- Set confidence scores (0.0-1.0) based on how clearly each aspect is mentioned
- Use null for values that cannot be determined
- Be conservative with confidence scores
- Include alternative interpretations in secondary fields where applicable
- Focus on extracting actual information mentioned, don't infer too much`;
}

// Fallback regex patterns for common trip elements
const FALLBACK_PATTERNS = {
  destinations: {
    countries: /\b(japan|italy|france|spain|germany|australia|thailand|vietnam|peru|chile|iceland|norway|new zealand|south africa|morocco|egypt|india|china|brazil|argentina|greece|portugal|turkey|mexico|costa rica|colombia|ecuador|bolivia|cambodia|laos|myanmar|philippines|indonesia|malaysia|singapore|south korea|taiwan|hong kong|dubai|israel|jordan|kenya|tanzania|uganda|rwanda|botswana|namibia|zambia|zimbabwe|madagascar|mauritius|seychelles|maldives|sri lanka|nepal|bhutan|pakistan|afghanistan|uzbekistan|kazakhstan|kyrgyzstan|tajikistan|mongolia|russia|finland|sweden|denmark|netherlands|belgium|switzerland|austria|czech republic|slovakia|hungary|poland|croatia|slovenia|bosnia|serbia|albania|montenegro|macedonia|bulgaria|romania|moldova|ukraine|belarus|estonia|latvia|lithuania|ireland|united kingdom|scotland|wales)\b/gi,
    cities: /\b(tokyo|paris|london|rome|barcelona|amsterdam|berlin|prague|vienna|budapest|istanbul|athens|lisbon|dublin|edinburgh|copenhagen|stockholm|oslo|helsinki|reykjavik|zurich|geneva|milan|florence|venice|naples|madrid|seville|granada|valencia|porto|marrakech|cairo|cape town|johannesburg|durban|casablanca|tunis|lagos|accra|nairobi|addis ababa|kigali|kampala|dar es salaam|zanzibar|victoria falls|serengeti|masai mara|kruger|kilimanjaro|mount kenya|atlas mountains|sahara|nile|zambezi|victoria|mumbai|delhi|bangalore|chennai|kolkata|goa|kerala|rajasthan|himalayas|ladakh|sikkim|bhutan|kathmandu|pokhara|everest|annapurna|beijing|shanghai|guangzhou|shenzhen|hong kong|macau|taipei|seoul|busan|osaka|kyoto|hiroshima|nagoya|sapporo|manila|cebu|boracay|palawan|bohol|bangkok|chiang mai|phuket|krabi|koh samui|pattaya|ayutthaya|sukhothai|luang prabang|vientiane|siem reap|phnom penh|ho chi minh|hanoi|hoi an|da nang|halong bay|sapa|hue|nha trang|mui ne|da lat|singapore|kuala lumpur|penang|langkawi|kota kinabalu|jakarta|yogyakarta|ubud|bali|lombok|komodo|flores|sumatra|java|borneo|sulawesi|sydney|melbourne|brisbane|perth|adelaide|darwin|cairns|gold coast|tasmania|auckland|wellington|christchurch|queenstown|rotorua|milford sound|fiordland|bay of islands|coromandel|waitomo|taupo|new york|los angeles|san francisco|chicago|miami|orlando|las vegas|seattle|boston|washington|philadelphia|atlanta|houston|denver|phoenix|san diego|portland|austin|nashville|charleston|savannah|new orleans|toronto|vancouver|montreal|calgary|ottawa|quebec city|mexico city|cancun|playa del carmen|tulum|puerto vallarta|cabo|guadalajara|oaxaca|san miguel|merida|lima|cusco|arequipa|trujillo|iquitos|machu picchu|sacred valley|amazon|andes|patagonia|buenos aires|mendoza|salta|bariloche|ushuaia|el calafate|rio de janeiro|sao paulo|salvador|brasilia|recife|fortaleza|manaus|iguazu|pantanal|santiago|valparaiso|atacama|easter island|torres del paine|patagonia|bogota|cartagena|medellin|cali|santa marta|leticia|san andres|quito|guayaquil|cuenca|galapagos|la paz|sucre|santa cruz|uyuni|potosi|cochabamba|asuncion)\b/gi,
    regions: /\b(europe|asia|africa|north america|south america|oceania|middle east|scandinavia|balkans|mediterranean|caribbean|central america|southeast asia|east asia|south asia|central asia|eastern europe|western europe|northern europe|southern europe|north africa|west africa|east africa|central africa|southern africa|patagonia|amazon|andes|himalayas|alps|rocky mountains|appalachian|great lakes|pacific coast|atlantic coast|gulf coast|midwest|southwest|northeast|northwest|southeast|pacific northwest|new england|mid atlantic|great plains|deep south|sun belt|rust belt|bible belt|tornado alley)\b/gi
  },
  dates: {
    months: /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/gi,
    seasons: /\b(spring|summer|fall|autumn|winter)\b/gi,
    durations: /\b(\d+)\s*(days?|weeks?|months?)\b/gi,
    relativeDates: /\b(next|this|coming)\s+(week|month|year|spring|summer|fall|autumn|winter)\b/gi
  },
  budget: {
    amounts: /\$?([0-9,]+)\s*(?:dollars?|usd|€|euros?|£|pounds?|gbp)?\s*(?:per person|pp|each|total|budget|around|about|up to|under|over|maximum|max|minimum|min)?/gi,
    ranges: /\$?([0-9,]+)\s*(?:-|to|and)\s*\$?([0-9,]+)/gi
  },
  groupSize: {
    numbers: /\b(\d+)\s*(?:people|persons?|adults?|travelers?|friends?|family members?)\b/gi,
    types: /\b(solo|couple|family|friends?|group)\b/gi
  },
  activities: {
    outdoor: /\b(hiking|camping|climbing|skiing|snowboarding|surfing|diving|snorkeling|kayaking|rafting|fishing|hunting|cycling|biking|trekking|backpacking|mountaineering|paragliding|skydiving|bungee|zip lining|rock climbing|ice climbing|canyoning|spelunking|caving|safari|wildlife|photography|bird watching|whale watching|aurora|northern lights|glacier|volcano|desert|jungle|rainforest|beach|coast|island|lake|river|waterfall|hot springs|geyser|national park|nature reserve|scenic|landscapes|outdoor|adventure|extreme|adrenaline|thrill)\b/gi,
    cultural: /\b(museum|gallery|temple|church|cathedral|mosque|synagogue|shrine|palace|castle|fort|ruins|archaeological|historical|heritage|unesco|world heritage|monument|statue|architecture|art|culture|cultural|history|historical|ancient|medieval|colonial|traditional|local|authentic|indigenous|tribal|festival|ceremony|music|dance|theater|opera|concert|performance|workshop|class|lesson|cooking|language|craft|handicraft|pottery|weaving|painting|sculpture|calligraphy|market|bazaar|souk|shopping|antique|vintage|local life|community|village|town|city tour|walking tour|bike tour|food tour|street food|local cuisine|restaurant|cafe|bar|pub|nightlife|entertainment)\b/gi,
    relaxation: /\b(spa|wellness|massage|yoga|meditation|retreat|relaxation|peaceful|tranquil|serene|calm|quiet|rest|unwind|recharge|rejuvenate|pamper|luxury|comfort|resort|hotel|beach|pool|jacuzzi|sauna|steam|thermal|hot spring|mineral spring|detox|cleanse|mindfulness|spiritual|zen|holistic|natural|organic|healthy|fitness|gym|pilates|tai chi|qigong|acupuncture|aromatherapy|reflexology|facial|manicure|pedicure|beauty|treatment|therapy)\b/gi
  }
};

// Sleep utility for retry delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Make API call to OpenAI
async function callOpenAI(prompt, retryCount = 0) {
  const { apiKey, baseUrl, model, maxTokens, temperature } = API_CONFIG.openai;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const requestBody = {
    model,
    messages: [
      {
        role: 'system',
        content: 'You are a professional travel agent expert at parsing trip descriptions into structured data. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: maxTokens,
    temperature,
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

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Invalid OpenAI API response format');
    }

    return data.choices[0].message.content;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('OpenAI API request timeout');
    }

    // Retry logic
    if (retryCount < API_CONFIG.maxRetries) {
      const delay = API_CONFIG.retryDelay * Math.pow(2, retryCount);
      // console.warn(`OpenAI API call failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${API_CONFIG.maxRetries}):`, error.message);

      await sleep(delay);
      return callOpenAI(prompt, retryCount + 1);
    }

    throw error;
  }
}

// Make API call to Anthropic Claude (fallback)
async function callAnthropic(prompt, retryCount = 0) {
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
      throw new Error(`Anthropic API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid Anthropic API response format');
    }

    return data.content[0].text;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Anthropic API request timeout');
    }

    // Retry logic
    if (retryCount < API_CONFIG.maxRetries) {
      const delay = API_CONFIG.retryDelay * Math.pow(2, retryCount);
      // console.warn(`Anthropic API call failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${API_CONFIG.maxRetries}):`, error.message);

      await sleep(delay);
      return callAnthropic(prompt, retryCount + 1);
    }

    throw error;
  }
}

// Parse AI response and validate
function parseAIResponse(responseText) {
  try {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : responseText;

    const parsed = JSON.parse(jsonText);

    // Validate structure and add defaults for missing fields
    const defaultStructure = {
      destinations: {
        primary: null,
        secondary: [],
        confidence: 0.1
      },
      dates: {
        startDate: null,
        endDate: null,
        duration: null,
        flexibility: 'flexible',
        confidence: 0.1
      },
      budget: {
        amount: null,
        currency: null,
        perPerson: true,
        range: { min: null, max: null },
        confidence: 0.1
      },
      groupSize: {
        size: null,
        type: 'solo',
        ageGroups: [],
        confidence: 0.1
      },
      activities: {
        interests: [],
        adventureLevel: 'moderate',
        categories: [],
        confidence: 0.1
      },
      accommodation: {
        type: null,
        preferences: [],
        confidence: 0.1
      },
      transportation: {
        preferences: [],
        confidence: 0.1
      },
      specialRequirements: {
        dietary: [],
        accessibility: [],
        other: [],
        confidence: 0.1
      },
      tripStyle: {
        pace: 'moderate',
        planning: 'flexible',
        socialLevel: 'social',
        confidence: 0.1
      },
      overallConfidence: 0.1
    };

    // Merge parsed with defaults
    function deepMerge(target, source) {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          target[key] = target[key] || {};
          deepMerge(target[key], source[key]);
        } else if (source[key] !== undefined) {
          target[key] = source[key];
        }
      }
      return target;
    }

    const result = deepMerge(defaultStructure, parsed);

    // Validate confidence scores
    function validateConfidence(obj) {
      if (obj && typeof obj === 'object') {
        if ('confidence' in obj) {
          obj.confidence = Math.max(0, Math.min(1, obj.confidence || 0.1));
        }
        for (const key in obj) {
          if (typeof obj[key] === 'object') {
            validateConfidence(obj[key]);
          }
        }
      }
    }

    validateConfidence(result);
    result.overallConfidence = Math.max(0, Math.min(1, result.overallConfidence || 0.1));

    return result;
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

// Fallback parsing using regex patterns
function fallbackParse(description) {
  const result = {
    destinations: { primary: null, secondary: [], confidence: 0.3 },
    dates: { startDate: null, endDate: null, duration: null, flexibility: 'flexible', confidence: 0.2 },
    budget: { amount: null, currency: null, perPerson: true, range: { min: null, max: null }, confidence: 0.2 },
    groupSize: { size: null, type: 'solo', ageGroups: [], confidence: 0.3 },
    activities: { interests: [], adventureLevel: 'moderate', categories: [], confidence: 0.4 },
    accommodation: { type: null, preferences: [], confidence: 0.1 },
    transportation: { preferences: [], confidence: 0.1 },
    specialRequirements: { dietary: [], accessibility: [], other: [], confidence: 0.1 },
    tripStyle: { pace: 'moderate', planning: 'flexible', socialLevel: 'social', confidence: 0.2 },
    overallConfidence: 0.2
  };

  const text = description.toLowerCase();

  // Extract destinations
  const countries = text.match(FALLBACK_PATTERNS.destinations.countries) || [];
  const cities = text.match(FALLBACK_PATTERNS.destinations.cities) || [];

  if (countries.length > 0) {
    result.destinations.primary = countries[0];
    result.destinations.secondary = countries.slice(1, 3);
    result.destinations.confidence = 0.7;
  } else if (cities.length > 0) {
    result.destinations.primary = cities[0];
    result.destinations.secondary = cities.slice(1, 3);
    result.destinations.confidence = 0.8;
  }

  // Extract budget information
  const budgetMatches = text.match(FALLBACK_PATTERNS.budget.amounts) || [];
  if (budgetMatches.length > 0) {
    const amount = budgetMatches[0].replace(/[^\d]/g, '');
    if (amount) {
      result.budget.amount = parseInt(amount);
      result.budget.currency = 'USD'; // Default assumption
      result.budget.confidence = 0.6;
    }
  }

  // Extract group size
  const groupMatches = text.match(FALLBACK_PATTERNS.groupSize.numbers) || [];
  if (groupMatches.length > 0) {
    const size = parseInt(groupMatches[0].replace(/\D/g, ''));
    if (size > 0) {
      result.groupSize.size = size;
      result.groupSize.confidence = 0.8;
    }
  }

  const typeMatches = text.match(FALLBACK_PATTERNS.groupSize.types) || [];
  if (typeMatches.length > 0) {
    result.groupSize.type = typeMatches[0];
    result.groupSize.confidence = Math.max(result.groupSize.confidence, 0.7);
  }

  // Extract activities
  const outdoorActivities = text.match(FALLBACK_PATTERNS.activities.outdoor) || [];
  const culturalActivities = text.match(FALLBACK_PATTERNS.activities.cultural) || [];
  const relaxationActivities = text.match(FALLBACK_PATTERNS.activities.relaxation) || [];

  result.activities.interests = [
    ...outdoorActivities.slice(0, 3),
    ...culturalActivities.slice(0, 3),
    ...relaxationActivities.slice(0, 2)
  ];

  if (outdoorActivities.length > culturalActivities.length) {
    result.activities.categories.push('outdoor');
    result.activities.adventureLevel = 'adventurous';
  }
  if (culturalActivities.length > 0) {
    result.activities.categories.push('cultural');
  }
  if (relaxationActivities.length > 0) {
    result.activities.categories.push('wellness');
  }

  if (result.activities.interests.length > 0) {
    result.activities.confidence = 0.6;
  }

  // Calculate overall confidence
  const confidences = [
    result.destinations.confidence,
    result.dates.confidence,
    result.budget.confidence,
    result.groupSize.confidence,
    result.activities.confidence
  ];
  result.overallConfidence = confidences.reduce((a, b) => a + b) / confidences.length;

  return result;
}

// Main parsing function
export async function parseTripDescription(description, options = {}) {
  if (!description || typeof description !== 'string') {
    throw new Error('Invalid trip description provided');
  }

  const trimmedDescription = description.trim();
  if (trimmedDescription.length < 10) {
    throw new Error('Trip description too short (minimum 10 characters)');
  }

  // Check cache first
  const cacheKey = generateCacheKey(trimmedDescription);
  const cachedResult = cache.get(cacheKey);

  if (cachedResult && !options.skipCache) {
    // console.log('Returning cached NLP parsing result');
    return {
      ...cachedResult,
      source: 'cache'
    };
  }

  const prompt = createParsingPrompt(trimmedDescription);
  let result = null;
  let source = 'fallback';
  let error = null;

  // Try OpenAI first
  try {
    // console.log('Parsing trip description with OpenAI');
    const aiResponse = await callOpenAI(prompt);
    result = parseAIResponse(aiResponse);
    source = 'openai';
  } catch (openaiError) {
    // console.warn('OpenAI parsing failed:', openaiError.message);
    error = openaiError.message;

    // Try Anthropic as fallback
    try {
      // console.log('Falling back to Anthropic Claude');
      const aiResponse = await callAnthropic(prompt);
      result = parseAIResponse(aiResponse);
      source = 'anthropic';
      error = null; // Clear error since Anthropic succeeded
    } catch (anthropicError) {
      // console.warn('Anthropic parsing failed:', anthropicError.message);
      error = `Both APIs failed - OpenAI: ${openaiError.message}, Anthropic: ${anthropicError.message}`;
    }
  }

  // Use regex fallback if AI failed
  if (!result) {
    // console.warn('AI parsing failed, using regex fallback');
    result = fallbackParse(trimmedDescription);
    source = 'fallback';
  }

  // Add metadata
  const finalResult = {
    ...result,
    source,
    error,
    originalDescription: trimmedDescription,
    parsedAt: new Date().toISOString()
  };

  // Cache successful results (even fallback ones)
  if (result.overallConfidence > 0.1) {
    cache.set(cacheKey, finalResult);
  }

  return finalResult;
}

// Utility function to get parsing confidence explanation
export function getConfidenceExplanation(parsedResult) {
  const explanations = [];

  if (parsedResult.destinations.confidence > 0.7) {
    explanations.push('Destinations clearly identified');
  } else if (parsedResult.destinations.confidence > 0.3) {
    explanations.push('Some destination information found');
  }

  if (parsedResult.dates.confidence > 0.7) {
    explanations.push('Travel dates well specified');
  } else if (parsedResult.dates.confidence > 0.3) {
    explanations.push('Some date information available');
  }

  if (parsedResult.budget.confidence > 0.7) {
    explanations.push('Budget clearly stated');
  } else if (parsedResult.budget.confidence > 0.3) {
    explanations.push('Budget range indicated');
  }

  if (parsedResult.activities.confidence > 0.7) {
    explanations.push('Activities and interests well defined');
  } else if (parsedResult.activities.confidence > 0.3) {
    explanations.push('Some activity preferences mentioned');
  }

  return explanations;
}

// Clear NLP cache
export function clearNLPCache() {
  cache.clear();
  // console.log('NLP parsing cache cleared');
}

// Get service configuration for debugging
export function getNLPServiceConfig() {
  return {
    hasOpenAIKey: !!API_CONFIG.openai.apiKey,
    hasAnthropicKey: !!API_CONFIG.anthropic.apiKey,
    openaiModel: API_CONFIG.openai.model,
    anthropicModel: API_CONFIG.anthropic.model,
    cacheTimeout: API_CONFIG.cacheTimeout,
    maxRetries: API_CONFIG.maxRetries,
  };
}

export default {
  parseTripDescription,
  getConfidenceExplanation,
  clearNLPCache,
  getNLPServiceConfig,
};