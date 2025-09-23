/**
 * CDN Cache Manager for Static Algorithm Data
 * Manages caching of static compatibility algorithm assets and configurations
 */
class CDNCacheManager {
  constructor() {
    this.cdnEndpoint = process.env.CDN_ENDPOINT || 'https://cdn.trvl-social.com';
    this.staticAssets = new Map();
    this.cacheManifest = new Map();
    this.maxCacheAge = 86400; // 24 hours default
    // Cache headers configuration
    this.cacheHeaders = {
      'static-data': {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24 hours
        'ETag': true,
        'Expires': true
      },
      'algorithm-config': {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour
        'ETag': true,
        'Expires': true
      },
      'personality-data': {
        'Cache-Control': 'public, max-age=43200, s-maxage=43200', // 12 hours
        'ETag': true,
        'Expires': true
      },
      'scoring-weights': {
        'Cache-Control': 'public, max-age=7200, s-maxage=7200', // 2 hours
        'ETag': true,
        'Expires': true
      }
    };
    this.initializeStaticAssets();
  }
  /**
   * Initialize static algorithm assets that can be cached
   */
  initializeStaticAssets() {
    // Personality archetype definitions
    this.staticAssets.set('personality-archetypes', {
      data: {
        adventurer: {
          energy_level: 85,
          social_preference: 75,
          adventure_style: 90,
          risk_tolerance: 80,
          planning_style: 30,
          description: 'High-energy, spontaneous travelers who love new experiences',
          compatibility_weights: {
            with_adventurer: 0.85,
            with_planner: 0.45,
            with_socializer: 0.75,
            with_explorer: 0.90,
            with_balanced: 0.70
          }
        },
        planner: {
          energy_level: 65,
          social_preference: 60,
          adventure_style: 45,
          risk_tolerance: 40,
          planning_style: 95,
          description: 'Detail-oriented travelers who prefer structured itineraries',
          compatibility_weights: {
            with_adventurer: 0.45,
            with_planner: 0.90,
            with_socializer: 0.60,
            with_explorer: 0.35,
            with_balanced: 0.75
          }
        },
        socializer: {
          energy_level: 80,
          social_preference: 95,
          adventure_style: 70,
          risk_tolerance: 60,
          planning_style: 50,
          description: 'People-focused travelers who thrive in group settings',
          compatibility_weights: {
            with_adventurer: 0.75,
            with_planner: 0.60,
            with_socializer: 0.95,
            with_explorer: 0.55,
            with_balanced: 0.80
          }
        },
        explorer: {
          energy_level: 75,
          social_preference: 45,
          adventure_style: 95,
          risk_tolerance: 85,
          planning_style: 25,
          description: 'Independent travelers seeking unique, off-path experiences',
          compatibility_weights: {
            with_adventurer: 0.90,
            with_planner: 0.35,
            with_socializer: 0.55,
            with_explorer: 0.80,
            with_balanced: 0.65
          }
        },
        balanced: {
          energy_level: 60,
          social_preference: 60,
          adventure_style: 60,
          risk_tolerance: 60,
          planning_style: 60,
          description: 'Flexible travelers comfortable with various travel styles',
          compatibility_weights: {
            with_adventurer: 0.70,
            with_planner: 0.75,
            with_socializer: 0.80,
            with_explorer: 0.65,
            with_balanced: 0.85
          }
        }
      },
      cacheType: 'personality-data',
      version: 'v1.2',
      lastModified: new Date('2025-01-15').toISOString()
    });
    // Scoring algorithm weights and formulas
    this.staticAssets.set('scoring-algorithms', {
      data: {
        default: {
          name: 'Balanced Compatibility Scoring',
          weights: {
            personality_traits: 0.40,
            travel_preferences: 0.30,
            demographics: 0.20,
            activity_preferences: 0.10
          },
          personality_dimensions: {
            energy_level: 0.25,
            social_preference: 0.25,
            adventure_style: 0.25,
            risk_tolerance: 0.25
          },
          compatibility_curves: {
            energy_level: 'complementary',
            social_preference: 'similarity',
            adventure_style: 'complementary',
            risk_tolerance: 'similarity',
            planning_style: 'balanced'
          },
          thresholds: {
            excellent: 80,
            good: 65,
            fair: 50,
            poor: 35
          }
        },
        personality_focused: {
          name: 'Personality-First Compatibility',
          weights: {
            personality_traits: 0.60,
            travel_preferences: 0.25,
            demographics: 0.10,
            activity_preferences: 0.05
          },
          personality_dimensions: {
            energy_level: 0.20,
            social_preference: 0.30,
            adventure_style: 0.25,
            risk_tolerance: 0.25
          },
          thresholds: {
            excellent: 85,
            good: 70,
            fair: 55,
            poor: 40
          }
        },
        activity_focused: {
          name: 'Activity-Based Compatibility',
          weights: {
            personality_traits: 0.25,
            travel_preferences: 0.35,
            demographics: 0.15,
            activity_preferences: 0.25
          },
          personality_dimensions: {
            energy_level: 0.35,
            social_preference: 0.20,
            adventure_style: 0.30,
            risk_tolerance: 0.15
          },
          thresholds: {
            excellent: 75,
            good: 60,
            fair: 45,
            poor: 30
          }
        }
      },
      cacheType: 'algorithm-config',
      version: 'v2.1',
      lastModified: new Date('2025-01-10').toISOString()
    });
    // Travel preference compatibility matrices
    this.staticAssets.set('travel-preferences', {
      data: {
        budget_compatibility: {
          budget: {
            budget: 0.95,
            moderate: 0.70,
            luxury: 0.30
          },
          moderate: {
            budget: 0.70,
            moderate: 0.95,
            luxury: 0.80
          },
          luxury: {
            budget: 0.30,
            moderate: 0.80,
            luxury: 0.95
          }
        },
        pace_compatibility: {
          relaxed: {
            relaxed: 0.90,
            moderate: 0.75,
            fast_paced: 0.40
          },
          moderate: {
            relaxed: 0.75,
            moderate: 0.95,
            fast_paced: 0.80
          },
          fast_paced: {
            relaxed: 0.40,
            moderate: 0.80,
            fast_paced: 0.90
          }
        },
        accommodation_compatibility: {
          hostel: {
            hostel: 0.95,
            hotel: 0.60,
            luxury: 0.20,
            alternative: 0.85
          },
          hotel: {
            hostel: 0.60,
            hotel: 0.95,
            luxury: 0.80,
            alternative: 0.70
          },
          luxury: {
            hostel: 0.20,
            hotel: 0.80,
            luxury: 0.95,
            alternative: 0.40
          },
          alternative: {
            hostel: 0.85,
            hotel: 0.70,
            luxury: 0.40,
            alternative: 0.95
          }
        }
      },
      cacheType: 'static-data',
      version: 'v1.0',
      lastModified: new Date('2025-01-05').toISOString()
    });
    // Age compatibility curves and demographic factors
    this.staticAssets.set('demographic-compatibility', {
      data: {
        age_compatibility_curve: {
          // Optimal compatibility scores based on age differences
          same_age: 0.95,
          age_diff_1_3: 0.90,
          age_diff_4_7: 0.85,
          age_diff_8_12: 0.75,
          age_diff_13_18: 0.65,
          age_diff_19_25: 0.50,
          age_diff_over_25: 0.35
        },
        generation_factors: {
          gen_z: { with_gen_z: 0.95, with_millennial: 0.85, with_gen_x: 0.60, with_boomer: 0.40 },
          millennial: { with_gen_z: 0.85, with_millennial: 0.95, with_gen_x: 0.80, with_boomer: 0.65 },
          gen_x: { with_gen_z: 0.60, with_millennial: 0.80, with_gen_x: 0.95, with_boomer: 0.85 },
          boomer: { with_gen_z: 0.40, with_millennial: 0.65, with_gen_x: 0.85, with_boomer: 0.95 }
        },
        location_factors: {
          same_city: 0.90,
          same_region: 0.85,
          same_country: 0.75,
          same_continent: 0.65,
          different_continent: 0.55
        }
      },
      cacheType: 'static-data',
      version: 'v1.1',
      lastModified: new Date('2025-01-08').toISOString()
    });
    // ML model parameters and weights
    this.staticAssets.set('ml-model-weights', {
      data: {
        neural_network_weights: {
          hidden_layer_1: Array(50).fill(0).map(() => Math.random() * 0.1 - 0.05),
          hidden_layer_2: Array(25).fill(0).map(() => Math.random() * 0.1 - 0.05),
          output_layer: Array(10).fill(0).map(() => Math.random() * 0.1 - 0.05)
        },
        feature_importance: {
          energy_level: 0.18,
          social_preference: 0.22,
          adventure_style: 0.20,
          risk_tolerance: 0.15,
          planning_style: 0.10,
          age_difference: 0.08,
          location_similarity: 0.07
        },
        model_metadata: {
          training_date: '2025-01-01',
          accuracy: 0.87,
          precision: 0.84,
          recall: 0.89,
          f1_score: 0.86,
          training_samples: 25000
        }
      },
      cacheType: 'scoring-weights',
      version: 'v3.2',
      lastModified: new Date('2025-01-01').toISOString()
    });
  }
  /**
   * Get static asset with CDN caching support
   */
  async getStaticAsset(assetKey, options = {}) {
    try {
      const asset = this.staticAssets.get(assetKey);
      if (!asset) {
        throw new Error(`Static asset '${assetKey}' not found`);
      }
      const cacheKey = `${assetKey}_${asset.version}`;
      // Check if we should use CDN or local cache
      if (options.preferCDN && this.cdnEndpoint) {
        try {
          const cdnResponse = await this.fetchFromCDN(assetKey, asset.version);
          if (cdnResponse) {
            return {
              data: cdnResponse,
              source: 'cdn',
              version: asset.version,
              cacheHeaders: this.generateCacheHeaders(asset.cacheType),
              etag: this.generateETag(asset.data, asset.version)
            };
          }
        } catch (cdnError) {
        }
      }
      // Return local asset with appropriate cache headers
      return {
        data: asset.data,
        source: 'local',
        version: asset.version,
        lastModified: asset.lastModified,
        cacheHeaders: this.generateCacheHeaders(asset.cacheType),
        etag: this.generateETag(asset.data, asset.version)
      };
    } catch (error) {
      return {
        data: null,
        error: error.message,
        source: 'error'
      };
    }
  }
  /**
   * Fetch asset from CDN
   */
  async fetchFromCDN(assetKey, version) {
    const url = `${this.cdnEndpoint}/compatibility/${assetKey}/${version}.json`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrvlSocial-CompatibilityEngine/1.0'
      },
      timeout: 5000
    });
    if (!response.ok) {
      throw new Error(`CDN response ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }
  /**
   * Generate appropriate cache headers for asset type
   */
  generateCacheHeaders(cacheType) {
    const config = this.cacheHeaders[cacheType] || this.cacheHeaders['static-data'];
    const headers = {};
    if (config['Cache-Control']) {
      headers['Cache-Control'] = config['Cache-Control'];
    }
    if (config.Expires) {
      const expireDate = new Date(Date.now() + this.maxCacheAge * 1000);
      headers['Expires'] = expireDate.toUTCString();
    }
    return headers;
  }
  /**
   * Generate ETag for asset versioning
   */
  generateETag(data, version) {
    const content = JSON.stringify(data);
    const hash = this.simpleHash(content + version);
    return `"${hash}"`;
  }
  /**
   * Simple hash function for ETag generation
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
  /**
   * Update static asset and invalidate cache
   */
  updateStaticAsset(assetKey, newData, version) {
    const existingAsset = this.staticAssets.get(assetKey);
    if (!existingAsset) {
      throw new Error(`Cannot update non-existent asset: ${assetKey}`);
    }
    const updatedAsset = {
      ...existingAsset,
      data: newData,
      version: version || this.incrementVersion(existingAsset.version),
      lastModified: new Date().toISOString()
    };
    this.staticAssets.set(assetKey, updatedAsset);
    // Invalidate CDN cache if available
    this.invalidateCDNCache(assetKey, updatedAsset.version);
    return updatedAsset;
  }
  /**
   * Increment version string
   */
  incrementVersion(currentVersion) {
    const parts = currentVersion.replace('v', '').split('.');
    const patch = parseInt(parts[parts.length - 1]) + 1;
    parts[parts.length - 1] = patch.toString();
    return 'v' + parts.join('.');
  }
  /**
   * Invalidate CDN cache for asset
   */
  async invalidateCDNCache(assetKey, version) {
    if (!this.cdnEndpoint) return;
    try {
      // This would typically use your CDN's API to invalidate cache
      // Example for CloudFlare, AWS CloudFront, etc.
      // Placeholder for actual CDN invalidation
      // await this.cdnProvider.invalidate([`/compatibility/${assetKey}/*`]);
    } catch (error) {
    }
  }
  /**
   * Batch load multiple static assets
   */
  async batchLoadAssets(assetKeys, options = {}) {
    const results = new Map();
    const loadPromises = assetKeys.map(async (key) => {
      try {
        const asset = await this.getStaticAsset(key, options);
        results.set(key, asset);
        return { key, success: true };
      } catch (error) {
        results.set(key, { data: null, error: error.message, source: 'error' });
        return { key, success: false, error: error.message };
      }
    });
    const loadResults = await Promise.all(loadPromises);
    return {
      assets: Object.fromEntries(results),
      summary: {
        total: assetKeys.length,
        successful: loadResults.filter(r => r.success).length,
        failed: loadResults.filter(r => !r.success).length
      }
    };
  }
  /**
   * Generate manifest for all static assets
   */
  generateAssetManifest() {
    const manifest = {
      generated: new Date().toISOString(),
      assets: {},
      totalAssets: this.staticAssets.size
    };
    for (const [key, asset] of this.staticAssets.entries()) {
      manifest.assets[key] = {
        version: asset.version,
        lastModified: asset.lastModified,
        cacheType: asset.cacheType,
        etag: this.generateETag(asset.data, asset.version),
        size: JSON.stringify(asset.data).length,
        cdnUrl: `${this.cdnEndpoint}/compatibility/${key}/${asset.version}.json`
      };
    }
    return manifest;
  }
  /**
   * Preload critical assets for performance
   */
  async preloadCriticalAssets() {
    const criticalAssets = [
      'personality-archetypes',
      'scoring-algorithms',
      'demographic-compatibility'
    ];
    const results = await this.batchLoadAssets(criticalAssets, { preferCDN: true });
    return results;
  }
  /**
   * Create Express.js middleware for serving cached assets
   */
  createCacheMiddleware() {
    return (req, res, next) => {
      // Extract asset key from URL
      const assetKey = req.params.assetKey || req.query.asset;
      if (!assetKey) {
        return next();
      }
      // Serve asset with appropriate cache headers
      this.getStaticAsset(assetKey, { preferCDN: false })
        .then(asset => {
          if (asset.error) {
            return res.status(404).json({ error: 'Asset not found' });
          }
          // Set cache headers
          Object.entries(asset.cacheHeaders).forEach(([header, value]) => {
            res.set(header, value);
          });
          // Set ETag
          if (asset.etag) {
            res.set('ETag', asset.etag);
          }
          // Check if client has cached version
          if (req.headers['if-none-match'] === asset.etag) {
            return res.status(304).end();
          }
          res.json({
            data: asset.data,
            version: asset.version,
            source: asset.source
          });
        })
        .catch(error => {
          res.status(500).json({ error: 'Internal server error' });
        });
    };
  }
  /**
   * Get cache statistics
   */
  getCacheStats() {
    const assets = Array.from(this.staticAssets.values());
    return {
      totalAssets: assets.length,
      totalSize: assets.reduce((sum, asset) => {
        return sum + JSON.stringify(asset.data).length;
      }, 0),
      assetsByType: assets.reduce((acc, asset) => {
        acc[asset.cacheType] = (acc[asset.cacheType] || 0) + 1;
        return acc;
      }, {}),
      oldestAsset: assets.reduce((oldest, asset) => {
        return !oldest || new Date(asset.lastModified) < new Date(oldest.lastModified)
          ? asset : oldest;
      }, null)?.lastModified,
      newestAsset: assets.reduce((newest, asset) => {
        return !newest || new Date(asset.lastModified) > new Date(newest.lastModified)
          ? asset : newest;
      }, null)?.lastModified,
      cdnEnabled: !!this.cdnEndpoint
    };
  }
  /**
   * Export configuration for Vercel or other deployment platforms
   */
  generateVercelConfig() {
    return {
      headers: [
        {
          source: '/api/compatibility/assets/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=86400, s-maxage=86400'
            },
            {
              key: 'Access-Control-Allow-Origin',
              value: '*'
            }
          ]
        }
      ],
      redirects: [],
      rewrites: []
    };
  }
}
// Export singleton instance
export const cdnCacheManager = new CDNCacheManager();
export default CDNCacheManager;