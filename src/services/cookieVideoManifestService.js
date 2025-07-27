import axios from 'axios';

/**
 * Cookie-based Video Manifest Service
 * Handles fetching videos using cookie authentication from AWS Lambda and CloudFront
 */
class CookieVideoManifestService {
  constructor() {
    this.cookieApiUrl = 'https://cckyy2rw6e.execute-api.us-east-1.amazonaws.com/default/generate_cookie';
    this.cloudfrontBaseUrl = 'https://d567mwlvwucmc.cloudfront.net/videos';
    this.retryConfig = {
      maxRetries: 3,
      delay: 1000,
      backoffMultiplier: 1.5
    };
  }

  /**
   * Fetches cookie from AWS Lambda function
   * @param {string} videoHandler - Video handler/folder name
   * @returns {Promise<string>} Cookie string
   */
  async fetchCookie(videoHandler) {
    try {
      console.log(`Fetching cookie for video handler: ${videoHandler}`);
      
      const response = await axios.get(this.cookieApiUrl, {
        params: {
          folder: `videos/${videoHandler}`
        },
        timeout: 10000 // 10 second timeout
      });

      // Check if response has the cookie in the expected format
      if (response.data && response.data.Cookie) {
        console.log('Cookie fetched successfully from response.data.Cookie');
        return response.data.Cookie;
      } else if (response.data && typeof response.data === 'string' && response.data.includes('Cookie:')) {
        // Handle case where response is a string with "Cookie: [value]" format
        const cookieMatch = response.data.match(/Cookie:\s*(.+)/);
        if (cookieMatch && cookieMatch[1]) {
          console.log('Cookie extracted from string response');
          return cookieMatch[1].trim();
        }
      } else if (response.data && response.data.cookie) {
        // Fallback to lowercase 'cookie' key
        console.log('Cookie fetched successfully from response.data.cookie');
        return response.data.cookie;
      } else if (response.headers['set-cookie']) {
        // Extract cookie from set-cookie header if not in response body
        const cookieHeader = response.headers['set-cookie'][0];
        const cookie = cookieHeader.split(';')[0];
        console.log('Cookie extracted from headers');
        return cookie;
      } else {
        console.error('No cookie found in response. Response data:', response.data);
        throw new Error('No cookie found in response');
      }
    } catch (error) {
      console.error('Error fetching cookie:', error.message);
      throw new Error(`Failed to fetch cookie: ${error.message}`);
    }
  }

  /**
   * Fetches manifest from CloudFront using cookie authentication
   * @param {string} videoPath - Path to the video (e.g., '1906Quick/master.m3u8')
   * @param {string} cookie - Authentication cookie
   * @returns {Promise<string>} Manifest content
   */
  async fetchManifestWithCookie(videoPath, cookie) {
    try {
      const manifestUrl = `${this.cloudfrontBaseUrl}/${videoPath}`;
      console.log(`Fetching manifest from: ${manifestUrl}`);
      
      const response = await axios.get(manifestUrl, {
        headers: {
          'Cookie': cookie,
          'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, audio/mpegurl',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000 // 15 second timeout
      });

      if (response.data) {
        console.log('Manifest fetched successfully');
        return response.data;
      } else {
        throw new Error('Empty manifest response');
      }
    } catch (error) {
      console.error('Error fetching manifest with cookie:', error.message);
      throw new Error(`Failed to fetch manifest: ${error.message}`);
    }
  }

  /**
   * Main method to fetch video manifest using cookie authentication
   * @param {string} videoHandler - Video handler/folder name
   * @param {string} videoPath - Path to the video manifest (e.g., '1906Quick/master.m3u8')
   * @param {Function} onError - Error callback function
   * @returns {Promise<Object>} Processed manifest data
   */
  async fetchVideoManifest(videoHandler, videoPath, onError = null) {
    let retries = 0;
    
    while (retries <= this.retryConfig.maxRetries) {
      try {
        console.log(`Fetching video manifest (attempt ${retries + 1}/${this.retryConfig.maxRetries + 1})`);
        
        // Step 1: Get cookie
        const cookie = await this.fetchCookie(videoHandler);
        
        // Step 2: Fetch manifest with cookie
        const manifestContent = await this.fetchManifestWithCookie(videoPath, cookie);
        
        return {
          modifiedManifest: manifestContent,
          manifestUrl: `${this.cloudfrontBaseUrl}/${videoPath}`,
          cookie: cookie,
          originalData: { manifest_content: manifestContent }
        };
        
      } catch (error) {
        console.error(`Video manifest fetch attempt ${retries + 1} failed:`, error.message);
        
        retries++;
        
        // If this was the last retry, handle the error
        if (retries > this.retryConfig.maxRetries) {
          console.error('All video manifest fetch attempts failed');
          if (onError) onError(error);
          throw error;
        }
        
        // Wait before retrying with exponential backoff
        const delay = this.retryConfig.delay * Math.pow(this.retryConfig.backoffMultiplier, retries - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Creates a blob URL from manifest content
   * @param {string} manifestContent - M3U8 manifest content
   * @returns {string} Blob URL
   */
  createManifestBlobUrl(manifestContent) {
    const blob = new Blob([manifestContent], { type: 'application/x-mpegURL' });
    return URL.createObjectURL(blob);
  }

  /**
   * Cleans up blob URLs to prevent memory leaks
   * @param {string} blobUrl - Blob URL to revoke
   */
  revokeBlobUrl(blobUrl) {
    if (blobUrl && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
  }

  /**
   * Validates video handler format
   * @param {string} videoHandler - Video handler to validate
   * @returns {boolean} True if valid
   */
  validateVideoHandler(videoHandler) {
    return videoHandler && typeof videoHandler === 'string' && videoHandler.trim().length > 0;
  }

  /**
   * Extracts video handler from URL if needed
   * @param {string} url - URL that might contain video handler
   * @returns {string} Extracted video handler
   */
  extractVideoHandlerFromUrl(url) {
    // This method can be customized based on your URL structure
    // For now, it returns the input as-is
    return url;
  }
}

// Export singleton instance
export const cookieVideoManifestService = new CookieVideoManifestService();

// Export class for custom instances if needed
export { CookieVideoManifestService };

// Export individual methods for direct use
export const {
  fetchVideoManifest,
  fetchCookie,
  fetchManifestWithCookie,
  createManifestBlobUrl,
  revokeBlobUrl
} = cookieVideoManifestService;
