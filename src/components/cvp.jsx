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
import { videoManifestService } from "../services/videoManifestService";

export default function CVPL({ watermark, handler, url, canPlay, onError, isConvertedVideo, isEncryptedVideo }) {
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
  
  // Encrypted video quality settings
  const [encryptedQuality, setEncryptedQuality] = uS('360p'); // Default to 360p
  const [isChangingQuality, setIsChangingQuality] = uS(false); // Prevent rapid quality changes
  const [pendingSeekTime, setPendingSeekTime] = uS(null); // Store time to seek to after quality change
  const [wasPlayingBeforeQualityChange, setWasPlayingBeforeQualityChange] = uS(false);
  const encryptedQualities = ['360p', '720p']; // Available qualities for encrypted videos (can be expanded)
  
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

  // Handle encrypted video quality changes (requires re-fetching manifest)
  const handleEncryptedQualityChange = async (newQuality) => {
    if (!isEncryptedVideo || encryptedQuality === newQuality || isChangingQuality) return;
    
    console.log(`Changing encrypted video quality from ${encryptedQuality} to ${newQuality}`);
    setIsChangingQuality(true);
    
    // Store current playback state before quality change
    const currentTime = vdrf.current?.currentTime || 0;
    const wasPlaying = !vdrf.current?.paused;
    
    console.log(`Storing playback state: currentTime=${currentTime}, wasPlaying=${wasPlaying}`);
    
    // Set pending seek time and playback state
    setPendingSeekTime(currentTime);
    setWasPlayingBeforeQualityChange(wasPlaying);
    
    // Update quality and close menu
    setEncryptedQuality(newQuality);
    setSettingsMenuAnchor(null);
    
    try {
      // Re-fetch manifest with new quality
      await fetchManifest(newQuality);
    } catch (error) {
      console.error('Error changing encrypted video quality:', error);
      if (onError) {
        onError({ type: 'quality_change', error });
      }
      // Reset states on error
      setPendingSeekTime(null);
      setWasPlayingBeforeQualityChange(false);
      setIsChangingQuality(false);
    }
  };

  // VIDEO MANIFEST FETCHING SERVICE
  const fetchManifest = async (quality = null) => {
    try {
      // Determine parameters based on video type
      let folder, manifestKey, videoType;
      
      if (isEncryptedVideo) {
        // Encrypted videos (latest) - use provided quality or default
        const selectedQuality = quality || encryptedQuality;
        folder = `encrypted/${handler}/${selectedQuality}`;  // Use encrypted/ prefix with dynamic quality
        manifestKey = 'index.m3u8';
        videoType = 'new_converted'; // As lambda expects 'new_converted' for encrypted videos
        console.log("Using encrypted video with handler:", handler, "and quality:", selectedQuality);
      } else if (isConvertedVideo) {
        // New EC2-converted videos (non-encrypted)
        folder = `videos/${handler}`;  // Include videos/ prefix
        manifestKey = 'master.m3u8';
        videoType = 'new_converted';
        console.log("Using new EC2-converted video with handler:", handler);
      } else {
        // Legacy videos
        folder = handler;  // No videos/ prefix for legacy
        manifestKey = 'index.m3u8';
        videoType = 'legacy';
        console.log("Using legacy video with handler:", handler);
      }
      
      console.log("CVP determined parameters:", { folder, manifestKey, videoType });
      
      const manifestData = await videoManifestService.fetchManifest(folder, manifestKey, videoType, onError);
      const { modifiedManifest, manifestUrl } = manifestData;

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

        // Create blob URL using the service
        const blobUrl = videoManifestService.createManifestBlobUrl(modifiedManifest);

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
          
          // Handle pending seek time after quality change
          if (pendingSeekTime !== null && vdrf.current) {
            console.log(`MANIFEST_PARSED: Seeking to pending time: ${pendingSeekTime}`);
            console.log(`MANIFEST_PARSED: Video readyState: ${vdrf.current.readyState}, duration: ${vdrf.current.duration}`);
            
            // Add a small delay to ensure the video is fully ready for seeking
            setTimeout(() => {
              if (!vdrf.current) return;
              
              // Safety check: ensure the seek time is valid and video is ready
              const videoDuration = vdrf.current.duration;
              const seekTime = videoDuration ? Math.min(pendingSeekTime, videoDuration) : pendingSeekTime;
              
              console.log(`MANIFEST_PARSED: Video duration: ${videoDuration}, seeking to: ${seekTime}`);
              
              // Only seek if we have a valid duration or if we're forcing the seek
              if (videoDuration > 0 || pendingSeekTime > 0) {
                vdrf.current.currentTime = seekTime;
                
                // Set a timeout in case seek doesn't complete
                const seekTimeout = setTimeout(() => {
                  console.warn('MANIFEST_PARSED: Seek timeout - forcing completion');
                  if (wasPlayingBeforeQualityChange && canPlay) {
                    vdrf.current?.play();
                  }
                  setPendingSeekTime(null);
                  setWasPlayingBeforeQualityChange(false);
                  setIsChangingQuality(false);
                }, 3000); // 3 second timeout
                
                // Wait for seek to complete, then resume playback if needed
                const handleSeeked = () => {
                  console.log(`MANIFEST_PARSED: Seek completed to: ${vdrf.current.currentTime}`);
                  clearTimeout(seekTimeout); // Clear the timeout
                  
                  if (wasPlayingBeforeQualityChange && canPlay) {
                    vdrf.current.play();
                  }
                  // Clear pending states
                  setPendingSeekTime(null);
                  setWasPlayingBeforeQualityChange(false);
                  setIsChangingQuality(false);
                  
                  // Remove the event listener
                  vdrf.current.removeEventListener('seeked', handleSeeked);
                };
                
                vdrf.current.addEventListener('seeked', handleSeeked);
              } else {
                console.warn('MANIFEST_PARSED: Video not ready for seeking, will try with FRAG_LOADED event');
                // Don't clear pending states yet, let FRAG_LOADED handle it
              }
            }, 200); // 200ms delay to ensure video is ready
          } else {
            // Normal playback (no quality change)
            if (canPlay) {
              vdrf.current.play();
            }
            // Make sure to reset changing quality state
            setIsChangingQuality(false);
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          console.log(`Quality switched to level ${data.level}: ${hls.levels[data.level]?.height}p`);
        });

        // Additional event to handle seeking when video is actually ready to play
        hls.on(Hls.Events.FRAG_LOADED, () => {
          // Only handle this if we have a pending seek and haven't already processed it
          if (pendingSeekTime !== null && vdrf.current && isChangingQuality) {
            console.log('First fragment loaded, checking if video is ready for seek');
            
            // Wait for the video element to be in a ready state
            const checkVideoReady = () => {
              if (!vdrf.current || pendingSeekTime === null) return;
              
              const readyState = vdrf.current.readyState;
              const videoDuration = vdrf.current.duration;
              
              console.log(`Video readyState: ${readyState}, duration: ${videoDuration}`);
              
              // Check if video has enough data loaded (readyState >= 2 means have current and at least the next frame)
              if (readyState >= 2 && videoDuration > 0) {
                const seekTime = Math.min(pendingSeekTime, videoDuration);
                
                console.log(`Video is ready for seek. Seeking to: ${seekTime}`);
                vdrf.current.currentTime = seekTime;
                
                const handleDelayedSeeked = () => {
                  console.log(`Delayed seek completed to: ${vdrf.current.currentTime}`);
                  
                  if (wasPlayingBeforeQualityChange && canPlay) {
                    vdrf.current.play();
                  }
                  // Clear pending states
                  setPendingSeekTime(null);
                  setWasPlayingBeforeQualityChange(false);
                  setIsChangingQuality(false);
                  
                  // Remove the event listener
                  vdrf.current.removeEventListener('seeked', handleDelayedSeeked);
                };
                
                vdrf.current.addEventListener('seeked', handleDelayedSeeked);
              } else {
                // Video not ready yet, try again after a short delay
                setTimeout(checkVideoReady, 100);
              }
            };
            
            checkVideoReady();
          }
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
        // Fallback for Safari and other browsers that support HLS natively
        vdrf.current.src = manifestUrl;
        vdrf.current.addEventListener('loadedmetadata', () => {
          setLoading(false);
          
          // Handle pending seek time after quality change
          if (pendingSeekTime !== null && vdrf.current) {
            console.log(`Seeking to pending time (Safari): ${pendingSeekTime}`);
            
            // Add a small delay to ensure the video is fully ready for seeking
            setTimeout(() => {
              if (!vdrf.current) return;
              
              // Safety check: ensure the seek time is valid and video is ready
              const videoDuration = vdrf.current.duration;
              const seekTime = videoDuration ? Math.min(pendingSeekTime, videoDuration) : pendingSeekTime;
              
              console.log(`Video duration (Safari): ${videoDuration}, seeking to: ${seekTime}`);
              
              // Only seek if we have a valid duration or if we're forcing the seek
              if (videoDuration > 0 || pendingSeekTime > 0) {
                vdrf.current.currentTime = seekTime;
                
                // Set a timeout in case seek doesn't complete
                const seekTimeout = setTimeout(() => {
                  console.warn('Seek timeout (Safari) - forcing completion');
                  if (wasPlayingBeforeQualityChange && canPlay) {
                    vdrf.current?.play();
                  }
                  setPendingSeekTime(null);
                  setWasPlayingBeforeQualityChange(false);
                  setIsChangingQuality(false);
                }, 3000); // 3 second timeout
                
                // Wait for seek to complete, then resume playback if needed
                const handleSeeked = () => {
                  console.log(`Seek completed to (Safari): ${vdrf.current.currentTime}`);
                  clearTimeout(seekTimeout); // Clear the timeout
                  
                  if (wasPlayingBeforeQualityChange && canPlay) {
                    vdrf.current.play();
                  }
                  // Clear pending states
                  setPendingSeekTime(null);
                  setWasPlayingBeforeQualityChange(false);
                  setIsChangingQuality(false);
                  
                  // Remove the event listener
                  vdrf.current.removeEventListener('seeked', handleSeeked);
                };
                
                vdrf.current.addEventListener('seeked', handleSeeked);
              } else {
                console.warn('Video not ready for seeking (Safari), clearing pending seek');
                setPendingSeekTime(null);
                setWasPlayingBeforeQualityChange(false);
                setIsChangingQuality(false);
              }
            }, 200); // 200ms delay to ensure video is ready
          } else {
            // Normal playback (no quality change)
            if (canPlay) {
              vdrf.current.play();
            }
            // Make sure to reset changing quality state
            setIsChangingQuality(false);
          }
        });

        vdrf.current.addEventListener('error', () => {
          setLoading(false);
          onError?.({ type: 'manifest' });
        });
      }
    } catch (error) {
      console.error('Error in fetchManifest:', error);
      setLoading(false);
      
      // Reset quality change states on error
      if (pendingSeekTime !== null) {
        setPendingSeekTime(null);
        setWasPlayingBeforeQualityChange(false);
        setIsChangingQuality(false);
      }
      
      onError?.({ type: 'manifest' });
    }
  };

  uE(() => {
    if (canPlay && vdrf.current && !loading) {
      vdrf.current.play();
    }
  }, [canPlay]);

  uE(() => {
    fetchManifest();
    console.log("Fetching...");
    const intervalId = setInterval(fetchManifest, 8 * 60 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url]);

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

        {/* Quality Indicator for Encrypted Videos */}
        {isEncryptedVideo && (
          <div style={{ 
            position: "absolute",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            background: isChangingQuality ? "rgba(255, 152, 0, 0.8)" : "rgba(156, 39, 176, 0.8)",
            backdropFilter: "blur(8px)",
            borderRadius: "8px",
            padding: "4px 8px",
            fontSize: "12px",
            color: "white",
            fontWeight: "bold",
            zIndex: 1000,
            border: isChangingQuality ? "1px solid rgba(255, 152, 0, 0.3)" : "1px solid rgba(156, 39, 176, 0.3)",
            transition: "all 0.3s ease"
          }}>
            {isChangingQuality ? "⏳ Changing..." : `🔒 ${encryptedQuality}`}
          </div>
        )}

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
                {(qualityLevels.length > 1 || isEncryptedVideo) && (
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
          {isEncryptedVideo ? (
            // Encrypted video quality options
            <>
              {encryptedQualities.map((quality) => (
                <MenuItem 
                  key={quality} 
                  onClick={() => !isChangingQuality && handleEncryptedQualityChange(quality)}
                  disabled={isChangingQuality}
                  sx={{
                    color: isChangingQuality ? 'rgba(255, 255, 255, 0.5)' : 'white',
                    borderRadius: '8px',
                    mx: 1,
                    my: 0.5,
                    '&:hover': {
                      background: !isChangingQuality ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    },
                    cursor: isChangingQuality ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ListItemText 
                    primary={quality}
                    secondary={encryptedQuality === quality ? '✓ Active' : isChangingQuality ? 'Changing...' : ''}
                    primaryTypographyProps={{ fontWeight: encryptedQuality === quality ? 'bold' : 'normal' }}
                    secondaryTypographyProps={{ color: '#4ecdc4', fontSize: '12px' }}
                  />
                </MenuItem>
              ))}
            </>
          ) : (
            // Regular HLS quality options (for non-encrypted videos)
            <>
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
            </>
          )}
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