import Hls from 'hls.js';
import axios from 'axios';
import {
  FastForward,
  Fullscreen,
  FullscreenExit,
  Pause,
  PlayArrow,
  Settings as SettingsIcon,
  VolumeUp,
  VolumeOff,
  VolumeDown
} from "@mui/icons-material";
import Replay10Icon from '@mui/icons-material/Replay10';
import Forward10Icon from '@mui/icons-material/Forward10';
import {
  Box as B,
  IconButton as IBT,
  Slider as Sl,
  Typography as T,
  CircularProgress as CP,
  Menu,
  MenuItem,
  ListItemText,
  Fade,
  Zoom
} from "@mui/material";
import { useEffect as uE, useRef as uR, useState as uS } from "react";
import {
  FullScreen as FSC,
  useFullScreenHandle as uFSC,
} from "react-full-screen";
import { jhsfg } from "../../af";
import { Buffer } from 'buffer';

export default function CVPL({ watermark, url, canPlay, onError, videoHandler, useCookieAuth = false }) {
  const fhandle = uFSC();
  const vdrf = uR(null);
  const slrf = uR(null);
  const animationRef = uR(null);
  const hlsRef = uR(null);

  const debounceTimeout = uR(null);

  const [speed, setSpeed] = uS(1);
  const speeds = [0.5, 1, 1.5, 2];

  const [isPlyV, stPlyV] = uS(false);
  const [cTV, stCTV] = uS(0);
  const [duration, stDV] = uS(0);
  const [loading, setLoading] = uS(true);
  const [showControls, setShowControls] = uS(true);
  const [volume, setVolume] = uS(1);
  const [isMuted, setIsMuted] = uS(false);
  const [isHovering, setIsHovering] = uS(false);
  
  // Quality settings state
  const [qualityLevels, setQualityLevels] = uS([]);
  const [currentQuality, setCurrentQuality] = uS(-1); // -1 means auto
  const [settingsMenuAnchor, setSettingsMenuAnchor] = uS(null);
  
  let timeoutId;

  const hTUF = () => {
    stCTV(vdrf.current.currentTime);
  };

  const hDCF = () => {
    stDV(vdrf.current.duration);
  };

  const hSCF = (e) => {
    if (!vdrf.current) return;
  
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  
    setLoading(true);
  
    const newTime = parseFloat(e.target.value);
    if (!isNaN(newTime) && newTime >= 0 && newTime <= vdrf.current.duration) {
      vdrf.current.currentTime = newTime;
      stCTV(newTime);
    }
  
    vdrf.current.onseeked = () => setLoading(false);
  };

  const handleForward10 = () => {
    if (!vdrf.current) return;
  
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  
    setLoading(true);
  
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  
    debounceTimeout.current = setTimeout(() => {
      const newTime = vdrf.current.currentTime + 10;
      if (newTime <= vdrf.current.duration) {
        vdrf.current.currentTime = newTime;
        stCTV(newTime);
      } else {
        vdrf.current.currentTime = vdrf.current.duration;
        stCTV(vdrf.current.duration);
      }
  
      vdrf.current.onseeked = () => setLoading(false);
    }, 600); 
  };  

  const handleBackward10 = () => {
    if (!vdrf.current) return;
  
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  
    setLoading(true);
  
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  
    debounceTimeout.current = setTimeout(() => {
      const newTime = vdrf.current.currentTime - 10;
      if (newTime >= 0) {
        vdrf.current.currentTime = newTime;
        stCTV(newTime);
      } else {
        vdrf.current.currentTime = 0;
        stCTV(0);
      }
  
      vdrf.current.onseeked = () => setLoading(false);
    }, 600); 
  }; 

  const handleVolumeChange = (event, newValue) => {
    const volumeValue = newValue / 100;
    setVolume(volumeValue);
    if (vdrf.current) {
      vdrf.current.volume = volumeValue;
      if (volumeValue === 0) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (vdrf.current) {
      if (isMuted) {
        vdrf.current.volume = volume;
        setIsMuted(false);
      } else {
        vdrf.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const aSF = () => {
    const newTime = vdrf.current.currentTime + 0.1;
    if (newTime <= duration) {
      vdrf.current.currentTime = newTime;
      stCTV(newTime);
      slrf.current.value = newTime;
      animationRef.current = requestAnimationFrame(aSF);
    }
  };

  const generateTheEssence = (secretCode, email) => {
    const timestamp = Date.now().toString();
    const base64Email = Buffer.from(email).toString('base64');
    const combined = timestamp + secretCode + base64Email;
    const shift = 3; 
    let encoded = '';

    for (let i = 0; i < combined.length; i++) {
      const char = combined[i];
      if (/[a-zA-Z]/.test(char)) {
        const base = char >= 'a' ? 'a'.charCodeAt(0) : 'A'.charCodeAt(0);
        encoded += String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
      } else if (/\d/.test(char)) {
        encoded += (parseInt(char, 10) + shift) % 10;
      } else {
        encoded += char;
      }
    }

    return encoded;
  };


// Updated getCookieForVideoAccess function
const getCookieForVideoAccess = async (videoHandler) => {
  try {
    console.log("🍪 Getting cookie for video access...");
    
    const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development';
    const cookieServiceUrl = isDevelopment 
      ? '/api/cookie'
      : (import.meta.env.VITE_COOKIE_SERVICE_URL || 'https://ccky2rw6e.execute-api.us-east-1.amazonaws.com/default/generate_cookie');
    
    console.log("🔗 Using cookie service URL:", cookieServiceUrl);
    
    const cookieResponse = await axios.get(cookieServiceUrl, {
      params: {
        folder: `videos/${videoHandler}`
      },
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log("✅ Cookie response received");
    
    // Parse the cookie string from response
    const cookieString = cookieResponse.data.Cookie || cookieResponse.data;
    console.log("🍪 Raw cookie string:", cookieString);
    
    // Extract individual cookies
    const parsedCookies = parseCookieResponse(cookieString);
    console.log("📝 Parsed cookies:", parsedCookies);
    
    // Set cookies in browser for automatic inclusion
    setCookiesInBrowser(parsedCookies, '.cloudfront.net');
    
    // Also return the parsed cookies for manual use if needed
    return {
      ...cookieResponse,
      parsedCookies
    };
    
  } catch (error) {
    console.error('❌ Error getting cookie:', error);
    throw error;
  }
};
  const fetchWithRetry = async (url, maxRetries, delay = 1000, onRetryError) => {
    let retries = 0;
    const email = watermark;
    const theessence = generateTheEssence("HET349DGHFRT#5$hY^GFS6*tH4*HW&", email);
    const headers = {
      'Content-Type': 'application/json',
      email: watermark,
      theensemble: theessence,
    };
    
    try {
      const response = await axios.get(url, { headers });
      return response;
    } catch (error) {
      console.error('Error fetching manifest:', error);
      throw error;
    }
  };

  const handleQualityChange = (qualityIndex) => {
    if (!hlsRef.current) return;
    
    setCurrentQuality(qualityIndex);
    setSettingsMenuAnchor(null);
    
    if (qualityIndex === -1) {
      hlsRef.current.currentLevel = -1;
      console.log('Switched to auto quality');
    } else {
      hlsRef.current.nextLevel = qualityIndex;
      console.log(`Switched to quality level ${qualityIndex}: ${qualityLevels[qualityIndex]?.height}p`);
    }
  };

  // Parse the concatenated cookie string and set individual cookies
const parseCookieResponse = (cookieString) => {
  const cookies = {};
  
  // Split by the cookie names to extract individual values
  const policyMatch = cookieString.match(/CloudFront-Policy=([^;]+)/);
  const signatureMatch = cookieString.match(/CloudFront-Signature=([^;]+)/);
  const keyPairMatch = cookieString.match(/CloudFront-Key-Pair-Id=([^;]+)/);
  
  if (policyMatch) cookies.policy = policyMatch[1];
  if (signatureMatch) cookies.signature = signatureMatch[1];
  if (keyPairMatch) cookies.keyPairId = keyPairMatch[1];
  
  return cookies;
};

// Set cookies manually in the browser
const setCookiesInBrowser = (cookies, domain = '.cloudfront.net') => {
  const cookieOptions = `; Path=/; Domain=${domain}; Secure; SameSite=None`;
  
  if (cookies.policy) {
    document.cookie = `CloudFront-Policy=${cookies.policy}${cookieOptions}`;
  }
  if (cookies.signature) {
    document.cookie = `CloudFront-Signature=${cookies.signature}${cookieOptions}`;
  }
  if (cookies.keyPairId) {
    document.cookie = `CloudFront-Key-Pair-Id=${cookies.keyPairId}${cookieOptions}`;
  }
  
  console.log("✅ CloudFront cookies set in browser");
};


  const fetchManifestWithCookies = async (videoHandler) => {
    try {
      console.log("🎬 Starting cookie-based video access...");
      
      // Step 1: Get cookie for video access
      const cookieResponse = await getCookieForVideoAccess(videoHandler);
      const {parsedCookies} = cookieResponse;
      // console.log("📥 Fetching manifest from:", manifestUrl);
      
      // Step 2: Try to fetch manifest - CloudFront CORS workaround
      const manifestUrl = `https://d567mwlvwucmc.cloudfront.net/videos/${videoHandler}/master.m3u8`;
      console.log("📥 Fetching manifest from:", manifestUrl);
      
      // CloudFront CORS workaround: Use fetch API with no-cors mode
      let manifestResponse;
      try {
        // console.log("Cookies:", document.cookie);
        // First try normal axios request
        manifestResponse = await axios.get(manifestUrl, {
          withCredentials: true,
          headers: {
        
            'Accept': 'application/vnd.apple.mpegurl',
            'Cache-Control': 'no-cache'
          },
          timeout: 15000
        });
      } catch (corsError) {
        console.log("🔄 CORS error details:", corsError.message);
        console.log("🔄 CORS error response:", corsError.response);
        
        // Alternative: Try fetch with detailed logging
        try {
          const fetchResponse = await fetch(manifestUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/vnd.apple.mpegurl'
            }
          });
          
          console.log("🔍 Fetch response status:", fetchResponse.status);
          console.log("🔍 Fetch response headers:", Array.from(fetchResponse.headers.entries()));
          
          if (fetchResponse.ok) {
            const manifestContent = await fetchResponse.text();
            manifestResponse = { data: manifestContent };
          } else {
            throw new Error(`Fetch failed with status: ${fetchResponse.status}`);
          }
        } catch (fetchError) {
          console.log("❌ Fetch also failed:", fetchError.message);
          throw fetchError;
        }
      }
      
      const manifestContent = manifestResponse.data;
      console.log("✅ Manifest fetched successfully");
      
      // Step 3: Process the manifest with HLS
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          xhrSetup: function (xhr, url) {
            // Ensure cookies are sent with segment requests
            xhr.withCredentials = true;
          }
        });
        
        hlsRef.current = hls;

        // Create blob URL for the manifest
        const blob = new Blob([manifestContent], { type: 'application/x-mpegURL' });
        const blobUrl = URL.createObjectURL(blob);

        hls.loadSource(blobUrl);
        hls.attachMedia(vdrf.current);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ Manifest parsed, available levels:', hls.levels);
          
          const levels = hls.levels.map((level, index) => ({
            index,
            height: level.height,
            width: level.width,
            bitrate: level.bitrate,
            name: `${level.height}p`
          }));
          
          setQualityLevels(levels);
          setLoading(false);
          
          if (canPlay) {
            vdrf.current.play();
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          console.log(`Quality switched to level ${data.level}: ${hls.levels[data.level]?.height}p`);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS Error:', data);
          setLoading(false);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Fatal network error encountered, try to recover');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Fatal media error encountered, try to recover');
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                onError?.({ type: 'manifest' });
                break;
            }
          }
        });

      } else if (vdrf.current.canPlayType('application/vnd.apple.mpegurl')) {
        // For Safari and other browsers that support HLS natively
        vdrf.current.src = manifestUrl;
        vdrf.current.addEventListener('loadedmetadata', () => {
          setLoading(false);
          if (canPlay) {
            vdrf.current.play();
          }
        });

        vdrf.current.addEventListener('error', () => {
          setLoading(false);
          onError?.({ type: 'manifest' });
        });
      }
    } catch (error) {
      console.error('❌ Error in cookie-based manifest fetching:', error);
      console.log('🔄 Attempting fallback to legacy authentication...');
      
      // Fallback to legacy authentication
      try {
        const BASE_URL = import.meta.env.VITE_GET_PRESIGN_URL_FUNCTION;
        const fallbackUrl = `${BASE_URL}?manifest_key=index.m3u8&segment_keys=index0.ts,index1.ts&folder=${videoHandler}&expiration=28800`;
        
        console.log('🔐 Fallback URL:', fallbackUrl);
        
        // Use legacy fetchManifest with fallback URL
        const response = await fetchWithRetry(fallbackUrl, 3, 1000, onError);
        const data = response.data;
        const modifiedManifest = data.modified_m3u8_content;

        if (Hls.isSupported()) {
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }

          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
          });
          
          hlsRef.current = hls;

          const blob = new Blob([modifiedManifest], { type: 'application/x-mpegURL' });
          const blobUrl = URL.createObjectURL(blob);

          hls.loadSource(blobUrl);
          hls.attachMedia(vdrf.current);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('✅ Fallback manifest parsed successfully');
            setLoading(false);
            if (canPlay) {
              vdrf.current.play();
            }
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS Error in fallback:', data);
            setLoading(false);
            if (data.fatal) {
              onError?.({ type: 'manifest' });
            }
          });
        }
        
        console.log('✅ Successfully fell back to legacy authentication');
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        setLoading(false);
        
        // Provide more context about the error
        const errorMessage = error.message || 'Cookie service unavailable';
        const fallbackErrorMessage = fallbackError.message || 'Legacy authentication failed';
        
        onError?.({ 
          type: 'manifest',
          message: `Video access failed: ${errorMessage}. Fallback error: ${fallbackErrorMessage}`,
          originalError: error,
          fallbackError: fallbackError
        });
      }
    }
  };

  const fetchManifest = async () => {
    try {
      const response = await fetchWithRetry(url, 3, 1000, onError);
      const data = response.data;
      const modifiedManifest = data.modified_m3u8_content;

      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });
        
        hlsRef.current = hls;

        const blob = new Blob([modifiedManifest], { type: 'application/x-mpegURL' });
        const blobUrl = URL.createObjectURL(blob);

        hls.loadSource(blobUrl);
        hls.attachMedia(vdrf.current);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('Manifest parsed, available levels:', hls.levels);
          
          const levels = hls.levels.map((level, index) => ({
            index,
            height: level.height,
            width: level.width,
            bitrate: level.bitrate,
            name: `${level.height}p`
          }));
          
          setQualityLevels(levels);
          setLoading(false);
          
          if (canPlay) {
            vdrf.current.play();
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          console.log(`Quality switched to level ${data.level}: ${hls.levels[data.level]?.height}p`);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS Error:', data);
          setLoading(false);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Fatal network error encountered, try to recover');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Fatal media error encountered, try to recover');
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                onError?.({ type: 'manifest' });
                break;
            }
          }
        });

      } else if (vdrf.current.canPlayType('application/vnd.apple.mpegurl')) {
        vdrf.current.src = data.manifest_url;
        vdrf.current.addEventListener('loadedmetadata', () => {
          setLoading(false);
          if (canPlay) {
            vdrf.current.play();
          }
        });

        vdrf.current.addEventListener('error', () => {
          setLoading(false);
          onError?.({ type: 'manifest' });
        });
      }
    } catch (error) {
      console.error('Error fetching manifest:', error);
      setLoading(false);
      onError?.({ type: 'manifest' });
    }
  };

  uE(() => {
    if (canPlay && vdrf.current && !loading) {
      vdrf.current.play();
    }
  }, [canPlay]);

  uE(() => {
    if (useCookieAuth && videoHandler) {
      // Use new cookie-based authentication
      fetchManifestWithCookies(videoHandler);
      console.log("🍪 Using cookie-based authentication for video:", videoHandler);
      
      // Refresh cookie every 4 hours (cookies expire after 8 hours)
      const intervalId = setInterval(() => {
        console.log("🔄 Refreshing cookie...");
        fetchManifestWithCookies(videoHandler);
      }, 4 * 60 * 60 * 1000);

      return () => {
        clearInterval(intervalId);
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    } else if (url) {
      // Use legacy authentication system
      fetchManifest();
      console.log("🔐 Using legacy authentication for URL:", url);
      
      const intervalId = setInterval(fetchManifest, 8 * 60 * 60 * 1000);

      return () => {
        clearInterval(intervalId);
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }
  }, [url, videoHandler, useCookieAuth]);

  uE(() => {
    if (vdrf.current) {
      vdrf.current.addEventListener("timeupdate", hTUF);
      vdrf.current.addEventListener("durationchange", hDCF);
      vdrf.current.addEventListener("playing", () => stPlyV(true));
      vdrf.current.addEventListener("pause", () => stPlyV(false));
    }

    return () => {
      if (vdrf.current) {
        vdrf.current.removeEventListener("timeupdate", hTUF);
        vdrf.current.removeEventListener("durationchange", hDCF);
        vdrf.current.removeEventListener("playing", () => stPlyV(true));
        vdrf.current.removeEventListener("pause", () => stPlyV(false));
      }
    };
  }, []);

  uE(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setShowControls(false), 4000);
    };

    const handleMouseLeave = () => {
      if (!isHovering) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setShowControls(false), 1000);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, [isHovering]);

  return (
    <FSC handle={fhandle}>
      <B
        sx={{
          position: "relative",
          overflow: "hidden",
          width: fhandle.active ? "100vw" : "100%",
          height: fhandle.active ? "100vh" : "fit-content",
          display: "flex",
          borderRadius: fhandle.active ? "0px" : "12px",
          background: "linear-gradient(145deg, #1a1a1a, #0a0a0a)",
          boxShadow: fhandle.active ? "none" : "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
        }}
        onDoubleClick={() => {
          if (fhandle.active) {
            fhandle.exit();
          } else {
            fhandle.enter();
          }
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <video
          width="100%"
          controls={false}
          preload="metadata"
          controlsList="nodownload"
          ref={vdrf}
          style={{
            backgroundColor: "black",
            borderRadius: fhandle.active ? "0px" : "12px",
            filter: loading ? "brightness(0.7)" : "brightness(1)",
            transition: "filter 0.3s ease",
          }}
          disablePictureInPicture
          disableRemotePlayback
          onContextMenu={(e) => {
            e.preventDefault();
          }}
          onClick={() => {
            if (isPlyV) {
              vdrf.current.pause();
            } else {
              vdrf.current.play();
            }
          }}
          className="video-player"
        >
          <T
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "white",
              fontSize: "30px",
              fontWeight: "bold",
              zIndex: 10000,
            }}
          >
            Your browser does not support this video.
          </T>
        </video>

        {/* Loading Overlay */}
        <Fade in={loading}>
          <B
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "white",
              fontSize: "30px",
              fontWeight: "bold",
              zIndex: 10000,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(10px)",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <CP color="inherit" size={40} />
            <T variant="body1" sx={{ opacity: 0.8 }}>Loading...</T>
          </B>
        </Fade>

        {/* Watermark */}
        <i className="watermark" style={{ 
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(8px)",
          borderRadius: "8px",
          padding: "4px 8px",
          fontSize: "12px",
          color: "rgba(255, 255, 255, 0.7)",
          zIndex: 1000,
        }}>{watermark}</i>

        {/* Modern Controls with Glass Morphism */}
        <Fade in={showControls} timeout={300}>
          <B
            sx={{
              position: "absolute",
              bottom: "0",
              left: "0",
              right: "0",
              background: "linear-gradient(transparent, rgba(0, 0, 0, 0.8))",
              backdropFilter: "blur(16px)",
              borderRadius: fhandle.active ? "0" : "0 0 12px 12px",
              zIndex: 1000,
              transition: "all 0.3s ease",
            }}
            component={"div"}
            onDoubleClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Progress Bar */}
            <B sx={{ px: 3, pt: 2 }}>
              <Sl
                sx={{
                  height: 6,
                  '& .MuiSlider-track': {
                    border: 'none',
                    background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4)',
                    borderRadius: 3,
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 3,
                  },
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: '2px solid #fff',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  },
                }}
                min={0}
                max={duration}
                step={0.1}
                value={cTV}
                onChange={hSCF}
                ref={slrf}
              />
            </B>

            {/* Control Buttons */}
            <B
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 3,
                py: 2,
                color: "white",
              }}
            >
              {/* Left Controls */}
              <B sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Zoom in={true}>
                  <IBT
                    sx={{
                      color: "white",
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "12px",
                      width: 44,
                      height: 44,
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      '&:hover': {
                        background: "rgba(255, 255, 255, 0.2)",
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s ease",
                    }}
                    onClick={handleBackward10}
                  >
                    <Replay10Icon fontSize="small" />
                  </IBT>
                </Zoom>

                <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                  <IBT
                    sx={{
                      color: "white",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      borderRadius: "50%",
                      width: 56,
                      height: 56,
                      boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)",
                      '&:hover': {
                        transform: "scale(1.1)",
                        boxShadow: "0 12px 32px rgba(102, 126, 234, 0.6)",
                      },
                      transition: "all 0.3s ease",
                    }}
                    onClick={() => {
                      if (isPlyV) {
                        vdrf.current.pause();
                      } else {
                        vdrf.current.play();
                      }
                    }}
                  >
                    {isPlyV ? <Pause fontSize="medium" /> : <PlayArrow fontSize="medium" />}
                  </IBT>
                </Zoom>

                <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                  <IBT
                    sx={{
                      color: "white",
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "12px",
                      width: 44,
                      height: 44,
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      '&:hover': {
                        background: "rgba(255, 255, 255, 0.2)",
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s ease",
                    }}
                    onClick={handleForward10}
                  >
                    <Forward10Icon fontSize="small" />
                  </IBT>
                </Zoom>

                {/* Volume Control */}
                <B sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
                  <IBT
                    sx={{
                      color: "white",
                      '&:hover': { transform: "scale(1.1)" },
                      transition: "all 0.2s ease",
                    }}
                    onClick={toggleMute}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeOff fontSize="small" />
                    ) : volume < 0.5 ? (
                      <VolumeDown fontSize="small" />
                    ) : (
                      <VolumeUp fontSize="small" />
                    )}
                  </IBT>
                  <Sl
                    sx={{
                      width: 80,
                      height: 4,
                      '& .MuiSlider-track': {
                        background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4)',
                      },
                      '& .MuiSlider-rail': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '& .MuiSlider-thumb': {
                        width: 12,
                        height: 12,
                        backgroundColor: '#fff',
                      },
                    }}
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume * 100}
                    onChange={handleVolumeChange}
                  />
                </B>

                {/* Time Display */}
                <T 
                  variant="body2" 
                  sx={{ 
                    ml: 2,
                    fontFamily: 'monospace',
                    background: "rgba(0, 0, 0, 0.4)",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  {formatTime(cTV)} / {formatTime(duration)}
                </T>
              </B>

              {/* Right Controls */}
              <B sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {/* Speed Control */}
                <IBT
                  sx={{
                    color: "white",
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "8px",
                    px: 1.5,
                    py: 0.5,
                    minWidth: 48,
                    height: 36,
                    fontSize: "12px",
                    fontWeight: "bold",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    '&:hover': {
                      background: "rgba(255, 255, 255, 0.2)",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => {
                    setSpeed((prevSpeed) => {
                      const newSpeed =
                        speeds[(speeds.indexOf(prevSpeed) + 1) % speeds.length];
                      vdrf.current.playbackRate = newSpeed;
                      return newSpeed;
                    });
                  }}
                >
                  {speed}x
                </IBT>

                {/* Quality Settings */}
                {qualityLevels.length > 1 && (
                  <IBT
                    sx={{
                      color: "white",
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "8px",
                      width: 36,
                      height: 36,
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      '&:hover': {
                        background: "rgba(255, 255, 255, 0.2)",
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s ease",
                    }}
                    onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
                  >
                    <SettingsIcon fontSize="small" />
                  </IBT>
                )}

                {/* Fullscreen */}
                <IBT
                  sx={{
                    color: "white",
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "8px",
                    width: 36,
                    height: 36,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    '&:hover': {
                      background: "rgba(255, 255, 255, 0.2)",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => {
                    if (fhandle.active) {
                      fhandle.exit();
                    } else {
                      fhandle.enter();
                    }
                  }}
                >
                  {fhandle.active ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
                </IBT>
              </B>
            </B>
          </B>
        </Fade>

        {/* Modern Quality Settings Menu */}
        <Menu
          anchorEl={settingsMenuAnchor}
          open={Boolean(settingsMenuAnchor)}
          onClose={() => setSettingsMenuAnchor(null)}
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 20, 0.9))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              minWidth: 140,
            }
          }}
        >
          <MenuItem 
            onClick={() => handleQualityChange(-1)}
            sx={{
              color: 'white',
              borderRadius: '8px',
              mx: 1,
              my: 0.5,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <ListItemText 
              primary="Auto" 
              secondary={currentQuality === -1 ? '✓ Active' : ''}
              primaryTypographyProps={{ fontWeight: currentQuality === -1 ? 'bold' : 'normal' }}
              secondaryTypographyProps={{ color: '#4ecdc4', fontSize: '12px' }}
            />
          </MenuItem>
          {qualityLevels.map((level) => (
            <MenuItem 
              key={level.index} 
              onClick={() => handleQualityChange(level.index)}
              sx={{
                color: 'white',
                borderRadius: '8px',
                mx: 1,
                my: 0.5,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <ListItemText 
                primary={level.name}
                secondary={currentQuality === level.index ? '✓ Active' : ''}
                primaryTypographyProps={{ fontWeight: currentQuality === level.index ? 'bold' : 'normal' }}
                secondaryTypographyProps={{ color: '#4ecdc4', fontSize: '12px' }}
              />
            </MenuItem>
          ))}
        </Menu>

        {/* Branding */}
        <T
          sx={{
            position: "absolute",
            top: "16px",
            left: "16px",  
            color: "rgba(255, 255, 255, 0.6)",
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            borderRadius: "8px",
            padding: "4px 12px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
            '&:hover': {
              color: "rgba(255, 255, 255, 0.8)",
              background: "rgba(0, 0, 0, 0.7)",
            }
          }}
        >
          {jhsfg([
            80, 111, 119, 101, 114, 101, 100, 32, 98, 121, 32, 79, 110, 101, 67, 111,
            100, 101,
          ])}
        </T>
      </B>
    </FSC>
  );
}