import axios from 'axios';

/**
 * Video Manifest Service - Optimized for CloudFront Caching
 * Reduced Lambda calls, better caching, static URLs
 */
class VideoManifestService {
  constructor() {
    // this.lambdaUrl = 'https://i1kwmbic8c.execute-api.us-east-1.amazonaws.com/geturl';
    this.lambdaUrl = 'https://7ezi89kw7f.execute-api.us-east-1.amazonaws.com/default/devhlsURLgenarator';
    this.retryConfig = {
      maxRetries: 2,  // Reduced retries since we have better caching
      delay: 1000,
      backoffMultiplier: 1.5
    };
    
    // In-memory cache to avoid redundant Lambda calls
    this.manifestCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes cache
  }

  /**
   * Creates cache key for manifest
   */
  createCacheKey(folder, manifestKey, videoType) {
    return `${folder}:${manifestKey}:${videoType}`;
  }

  /**
   * Check if cached manifest is still valid
   */
  isCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.cacheExpiry;
  }

  /**
   * Creates query parameters for Lambda function
   */
  createLambdaParams(folder, manifestKey = 'master.m3u8', videoType = 'new_converted') {
    return {
      folder,
      manifest_key: manifestKey,
      video_type: videoType,
      // Removed expiration and use_cloudfront - using static URLs now
    };
  }

  /**
   * Fetches manifest with improved caching and retry logic
   */
  async fetchManifestWithRetry(folder, manifestKey, videoType, onError = null) {
    const cacheKey = this.createCacheKey(folder, manifestKey, videoType);
    
    // Check in-memory cache first
    const cached = this.manifestCache.get(cacheKey);
    if (this.isCacheValid(cached)) {
      console.log('Using cached manifest:', cacheKey);
      return cached.response;
    }

    let retries = 0;
    const params = this.createLambdaParams(folder, manifestKey, videoType);
    
    while (retries <= this.retryConfig.maxRetries) {
      try {
        console.log(`Fetching manifest (attempt ${retries + 1}/${this.retryConfig.maxRetries + 1}):`, {
          folder,
          manifestKey,
          videoType
        });
        
        const response = await axios.get(this.lambdaUrl, { 
          params,
          timeout: 30000, // Reduced timeout
          headers: {
            'Cache-Control': 'max-age=3600', // Request caching
          }
        });
        
        // Cache the successful response
        this.manifestCache.set(cacheKey, {
          response,
          timestamp: Date.now()
        });
        
        console.log('Manifest fetch successful and cached');
        return response;
        
      } catch (error) {
        console.error(`Manifest fetch attempt ${retries + 1} failed:`, error.message);
        
        retries++;
        
        if (retries > this.retryConfig.maxRetries) {
          console.error('All manifest fetch attempts failed');
          if (onError) onError(error);
          throw error;
        }
        
        const delay = this.retryConfig.delay * Math.pow(this.retryConfig.backoffMultiplier, retries - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Processes the manifest response and extracts the content
   */
  processManifestResponse(response) {
    const data = response.data;
    
    if (!data || !data.modified_m3u8_content) {
      throw new Error('Invalid manifest response: missing modified_m3u8_content');
    }

    return {
      modifiedManifest: data.modified_m3u8_content,
      manifestUrl: data.manifest_url,
      originalData: data,
      deliveryMethod: data.delivery_method || 'cloudfront_static'
    };
  }

  /**
   * Main method to fetch and process manifest from Lambda function
   * Now with intelligent caching to reduce Lambda calls
   */
  async fetchManifest(folder, manifestKey = 'master.m3u8', videoType = 'new_converted', onError = null) {
    try {
      const response = await this.fetchManifestWithRetry(folder, manifestKey, videoType, onError);
      return this.processManifestResponse(response);
    } catch (error) {
      console.error('Failed to fetch manifest:', error);
      throw error;
    }
  }

  /**
   * Creates a blob URL from manifest content
   */
  createManifestBlobUrl(manifestContent) {
    const blob = new Blob([manifestContent], { type: 'application/x-mpegURL' });
    return URL.createObjectURL(blob);
  }

  /**
   * Cleans up blob URLs and cache to prevent memory leaks
   */
  revokeBlobUrl(blobUrl) {
    if (blobUrl && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
  }

  /**
   * Clear expired cache entries (call periodically)
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of this.manifestCache.entries()) {
      if ((now - entry.timestamp) > this.cacheExpiry) {
        this.manifestCache.delete(key);
      }
    }
  }

  /**
   * Manual cache clear (for debugging)
   */
  clearCache() {
    this.manifestCache.clear();
    console.log('Manifest cache cleared');
  }
}

// Export singleton instance
export const videoManifestService = new VideoManifestService();

// Cleanup cache every 2 hours (more reasonable)
setInterval(() => {
  videoManifestService.cleanupCache();
}, 2 * 60 * 60 * 1000);

// Also cleanup when cache gets too large (safety measure)
const originalSet = videoManifestService.manifestCache.set;
videoManifestService.manifestCache.set = function(key, value) {
  if (this.size > 100) { // Limit to 100 cached manifests
    videoManifestService.cleanupCache();
  }
  return originalSet.call(this, key, value);
};

// Export class for custom instances if needed
export { VideoManifestService };

// Export individual methods for direct use
export const {
  fetchManifest,
  createManifestBlobUrl,
  revokeBlobUrl,
  clearCache
} = videoManifestService;