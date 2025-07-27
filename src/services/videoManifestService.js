import axios from 'axios';
import { Buffer } from 'buffer';

/**
 * Video Manifest Service
 * Handles fetching and processing of video manifests with authentication
 */
class VideoManifestService {
  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      delay: 1000,
      backoffMultiplier: 1.5
    };
  }

  /**
   * Generates authentication essence for secure manifest requests
   * @param {string} secretCode - Secret code for encoding
   * @param {string} email - User email for authentication
   * @returns {string} Encoded authentication string
   */
  generateTheEssence(secretCode, email) {
    const timestamp = Date.now().toString();
    const base64Email = Buffer.from(email).toString('base64');
    const combined = timestamp + secretCode + base64Email;
    const shift = 3; 
    let encoded = '';

    for (let i = 0; i < combined.length; i++) {
      const char = combined[i];
      if (/[a-zA-Z]/.test(char)) {
        const base64 = char >= 'a' ? 'a'.charCodeAt(0) : 'A'.charCodeAt(0);
        encoded += String.fromCharCode(((char.charCodeAt(0) - base64 + shift) % 26) + base64);
      } else if (/\d/.test(char)) {
        encoded += (parseInt(char, 10) + shift) % 10;
      } else {
        encoded += char;
      }
    }

    return encoded;
  }

  /**
   * Creates authenticated headers for manifest requests
   * @param {string} email - User email/watermark
   * @returns {Object} Headers object with authentication
   */
  createAuthHeaders(email) {
    const theessence = this.generateTheEssence("HET349DGHFRT#5$hY^GFS6*tH4*HW&", email);
    return {
      'Content-Type': 'application/json',
      email: email,
      theensemble: theessence,
    };
  }

  /**
   * Fetches manifest with retry logic
   * @param {string} url - Manifest URL
   * @param {string} email - User email for authentication
   * @param {Function} onError - Error callback function
   * @returns {Promise<Object>} Axios response object
   */
  async fetchManifestWithRetry(url, email, onError = null) {
    let retries = 0;
    const headers = this.createAuthHeaders(email);
    
    while (retries <= this.retryConfig.maxRetries) {
      try {
        console.log(`Fetching manifest (attempt ${retries + 1}/${this.retryConfig.maxRetries + 1}):`, url);
        
        const response = await axios.get(url, { 
          headers,
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
   * Main method to fetch and process manifest
   * @param {string} url - Manifest URL
   * @param {string} email - User email for authentication
   * @param {Function} onError - Error callback function
   * @returns {Promise<Object>} Processed manifest data
   */
  async fetchManifest(url, email, onError = null) {
    try {
      const response = await this.fetchManifestWithRetry(url, email, onError);
      return this.processManifestResponse(response);
    } catch (error) {
      console.error('Failed to fetch manifest:', error);
      throw error;
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
  createAuthHeaders,
  generateTheEssence
} = videoManifestService;
