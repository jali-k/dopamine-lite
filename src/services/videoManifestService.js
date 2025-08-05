import axios from 'axios';

/**
 * Video Manifest Service
 * Handles fetching and processing of video manifests from AWS Lambda pre-signed URL generator
 */
class VideoManifestService {
  constructor() {
    // this.lambdaUrl = 'https://i1kwmbic8c.execute-api.us-east-1.amazonaws.com/geturl';
    this.lambdaUrl = 'https://7ezi89kw7f.execute-api.us-east-1.amazonaws.com/default/devhlsURLgenarator';
    this.retryConfig = {
      maxRetries: 3,
      delay: 1000,
      backoffMultiplier: 1.5
    };
  }

  /**
   * Creates query parameters for Lambda function
   * @param {string} folder - Video folder name
   * @param {string} manifestKey - Manifest file key (e.g., 'master.m3u8')
   * @param {string} videoType - Video type ('legacy' or 'new_converted')
   * @param {number} expiration - URL expiration time in seconds
   * @returns {Object} Query parameters object
   */
  createLambdaParams(folder, manifestKey = 'master.m3u8', videoType = 'new_converted', expiration = 28800) {
    return {
      folder,
      manifest_key: manifestKey,
      video_type: videoType,
      expiration: expiration.toString(),
      use_cloudfront: "true"
    };
  }

  /**
   * Fetches manifest with retry logic from Lambda function
   * @param {string} folder - Video folder name
   * @param {string} manifestKey - Manifest file key
   * @param {string} videoType - Video type ('legacy' or 'new_converted')
   * @param {number} expiration - URL expiration time
   * @param {Function} onError - Error callback function
   * @returns {Promise<Object>} Axios response object
   */
  async fetchManifestWithRetry(folder, manifestKey, videoType, expiration, onError = null) {
    let retries = 0;
    const params = this.createLambdaParams(folder, manifestKey, videoType, expiration);
    
    while (retries <= this.retryConfig.maxRetries) {
      try {
        console.log(`Fetching manifest (attempt ${retries + 1}/${this.retryConfig.maxRetries + 1}):`, {
          folder,
          manifestKey,
          videoType
        });
        
        const response = await axios.get(this.lambdaUrl, { 
          params,
          timeout: 30000 // 30 second timeout
        });
        
        console.log('Manifest fetch successful');
        return response;
        
      } catch (error) {
        console.error(`Manifest fetch attempt ${retries + 1} failed:`, error.message);
        
        retries++;
        
        // If this was the last retry, throw the error
        if (retries > this.retryConfig.maxRetries) {
          console.error('All manifest fetch attempts failed');
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
   * Processes the manifest response and extracts the content
   * @param {Object} response - Axios response object
   * @returns {Object} Processed manifest data
   */
  processManifestResponse(response) {
    const data = response.data;
    
    if (!data || !data.modified_m3u8_content) {
      throw new Error('Invalid manifest response: missing modified_m3u8_content');
    }

    return {
      modifiedManifest: data.modified_m3u8_content,
      manifestUrl: data.manifest_url,
      originalData: data
    };
  }

  /**
   * Main method to fetch and process manifest from Lambda function
   * @param {string} folder - Video folder name (e.g., 'videos/timer30min')
   * @param {string} manifestKey - Manifest file key (default: 'master.m3u8')
   * @param {string} videoType - Video type ('new_converted' or 'legacy')
   * @param {Function} onError - Error callback function
   * @returns {Promise<Object>} Processed manifest data
   */
  async fetchManifest(folder, manifestKey = 'master.m3u8', videoType = 'new_converted', onError = null) {
    try {
      // Create params with only the 3 required parameters
      const params = {
        folder,
        manifest_key: manifestKey,
        video_type: videoType
      };
      
      const response = await this.fetchManifestWithParams(params, onError);
      return this.processManifestResponse(response);
    } catch (error) {
      console.error('Failed to fetch manifest:', error);
      throw error;
    }
  }

  /**
   * Fetches manifest with custom parameters
   * @param {Object} params - Query parameters for Lambda function
   * @param {Function} onError - Error callback function
   * @returns {Promise<Object>} Axios response object
   */
  async fetchManifestWithParams(params, onError = null) {
    let retries = 0;
    
    while (retries <= this.retryConfig.maxRetries) {
      try {
        console.log(`Fetching manifest (attempt ${retries + 1}/${this.retryConfig.maxRetries + 1}):`, params);
        
        const response = await axios.get(this.lambdaUrl, { 
          params,
          timeout: 30000 // 30 second timeout
        });
        
        console.log('Manifest fetch successful');
        return response;
        
      } catch (error) {
        console.error(`Manifest fetch attempt ${retries + 1} failed:`, error.message);
        
        retries++;
        
        // If this was the last retry, throw the error
        if (retries > this.retryConfig.maxRetries) {
          console.error('All manifest fetch attempts failed');
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
}

// Export singleton instance
export const videoManifestService = new VideoManifestService();

// Export class for custom instances if needed
export { VideoManifestService };

// Export individual methods for direct use
export const {
  fetchManifest,
  createManifestBlobUrl,
  revokeBlobUrl,
  createLambdaParams
} = videoManifestService;
