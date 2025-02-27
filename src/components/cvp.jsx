import Hls from 'hls.js';
import axios from 'axios';
import {
  FastForward,
  Fullscreen,
  FullscreenExit,
  Pause,
  PlayArrow,
} from "@mui/icons-material";
import Replay10Icon from '@mui/icons-material/Replay10';
import Forward10Icon from '@mui/icons-material/Forward10';
import {
  Box as B,
  IconButton as IBT,
  Slider as Sl,
  Typography as T,
  CircularProgress as CP,
} from "@mui/material";
import { useEffect as uE, useRef as uR, useState as uS } from "react";
import {
  FullScreen as FSC,
  useFullScreenHandle as uFSC,
} from "react-full-screen";
import { jhsfg } from "../../af";
import { Buffer } from 'buffer';

export default function CVPL({ watermark, url, canPlay, onError }) {
  const fhandle = uFSC();
  const vdrf = uR(null);
  const slrf = uR(null);
  const animationRef = uR(null);

  const debounceTimeout = uR(null);

  const [speed, setSpeed] = uS(1);
  const speeds = [0.5, 1, 1.5, 2];

  const [isPlyV, stPlyV] = uS(false);
  const [cTV, stCTV] = uS(0);
  const [duration, stDV] = uS(0);
  const [loading, setLoading] = uS(true);

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
        stCTV(vdrf.current.duration);
      }
  
      vdrf.current.onseeked = () => setLoading(false);
    }, 600); 
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
    const timestamp = Date.now().toString(); // Current timestamp as a string

    // Base64 encode the email
    const base64Email = Buffer.from(email).toString('base64');

    // Combine timestamp, secret code, and Base64-encoded email
    const combined = timestamp + secretCode + base64Email;
    const shift = 3; 
    let encoded = '';

    // Encode by shifting each character
    for (let i = 0; i < combined.length; i++) {
      const char = combined[i];
      if (/[a-zA-Z]/.test(char)) {
        const base = char >= 'a' ? 'a'.charCodeAt(0) : 'A'.charCodeAt(0);
        encoded += String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
      } else if (/\d/.test(char)) {
        encoded += (parseInt(char, 10) + shift) % 10; // Shift digits
      } else {
        encoded += char; // Leave non-alphanumeric characters unchanged
      }
    }

    return encoded;
  };


  const fetchWithRetry = async (url, maxRetries, delay = 1000, onRetryError) => {
    let retries = 0;
    const email = watermark;
    const theessence = generateTheEssence("HET349DGHFRT#5$hY^GFS6*tH4*HW&", email);
    // Headers to send with the request
    const headers = {
      'Content-Type': 'application/json',
      email: watermark, // Custom header
      theensemble: theessence, // Another custom header

    };
    const body = {
      email: watermark,
      theensemble: '#RTDFGhrt^756HG^#*756GDF',
    }
    while (retries < maxRetries) {
      try {
        const response = await axios.get(url, { headers });
        // const response = await fetch(url, {
        //   method: 'GET',
        //   headers: {
        //     'Content-Type' : 'application/json'
        //   // //  `${watermark}`: 'email',
        //   //   '#RTDFGhrt^756HG^#*756GDF': 'theensemble',
        //   },
        //   body: JSON.stringify(body),
        // });
        return response;
        // if (response.ok) {
        //   return response;
        // } else {
        //   retries++;
        //   if (retries < maxRetries) {
        //     onRetryError?.({ type: 'retry', attempt: retries });
        //     await new Promise(resolve => setTimeout(resolve, delay));
        //   }
        // }
      } catch (error) {
        console.error('Error fetching manifest:', error);
        // retries++;
        // if (retries < maxRetries) {
        //   onRetryError?.({ type: 'retry', attempt: retries });
        //   await new Promise(resolve => setTimeout(resolve, delay));
        // }
      }
    }
    throw new Error('Failed to fetch manifest after several retries.');
  };

  const fetchManifest = async () => {
    try {
      // Call the fetchWithRetry function
      const response = await fetchWithRetry(url, 3, 1000, onError);

      // Axios automatically parses JSON; no need for `response.json()`
      const data = response.data;
      const modifiedManifest = data.modified_m3u8_content;

      if (Hls.isSupported()) {
        const hls = new Hls();

        // Create a Blob URL for the modified manifest
        const blob = new Blob([modifiedManifest], { type: 'application/x-mpegURL' });
        const blobUrl = URL.createObjectURL(blob);

        // Load the blob URL into Hls.js
        hls.loadSource(blobUrl);
        hls.attachMedia(vdrf.current);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          if (canPlay) {
            vdrf.current.play();
          }
        });

        hls.on(Hls.Events.ERROR, () => {
          setLoading(false);
          onError?.({ type: 'manifest' });
        });
      } else if (vdrf.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Fallback for native HLS support
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


  // const fetchManifest = async () => {
  //   try {
  //     const response = await fetchWithRetry(url, 3, 1000, onError);
  //     const data = await response.json();
  //     const modifiedManifest = data.modified_m3u8_content;

  //     if (Hls.isSupported()) {
  //       const hls = new Hls();
  //       const blob = new Blob([modifiedManifest], { type: 'application/x-mpegURL' });
  //       const blobUrl = URL.createObjectURL(blob);
  //       hls.loadSource(blobUrl);
  //       hls.attachMedia(vdrf.current);

  //       hls.on(Hls.Events.MANIFEST_PARSED, () => {
  //         setLoading(false);
  //         if (canPlay) {
  //           vdrf.current.play();
  //         }
  //       });

  //       hls.on(Hls.Events.ERROR, () => {
  //         setLoading(false);
  //         onError?.({ type: 'manifest' });
  //       });
  //     } else if (vdrf.current.canPlayType('application/vnd.apple.mpegurl')) {
  //       vdrf.current.src = data.manifest_url;
  //       vdrf.current.addEventListener('loadedmetadata', () => {
  //         setLoading(false);
  //         if (canPlay) {
  //           vdrf.current.play();
  //         }
  //       });

  //       vdrf.current.addEventListener('error', () => {
  //         setLoading(false);
  //         onError?.({ type: 'manifest' });
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error fetching manifest:', error);
  //     setLoading(false);
  //     onError?.({ type: 'manifest' });
  //   }
  // };

  // Add this effect to handle playback when security check completes
  uE(() => {
    if (canPlay && vdrf.current && !loading) {
      vdrf.current.play();
    }
  }, [canPlay]);

  uE(() => {
    fetchManifest();
    const intervalId = setInterval(fetchManifest, 3* 60 * 60 * 1000); // Refresh manifest every 55 minutes

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

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

  return (
    <FSC handle={fhandle}>
  <B
    sx={{
      position: "relative",
      overflow: "hidden",
      width: fhandle.active ? "100vw" : "100%",
      height: fhandle.active ? "100vh" : "fit-content",
      display: "flex",
    }}
    onDoubleClick={() => {
      if (fhandle.active) {
        fhandle.exit();
      } else {
        fhandle.enter();
      }
    }}
  >
    <video
      width="100%"
      controls={false}
      preload="metadata"
      controlsList="nodownload"
      ref={vdrf}
      style={{
        backgroundColor: "black",
        borderRadius: fhandle.active ? "0px" : "6px",
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
    {loading && (
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
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CP color="inherit" />
      </B>
    )}
    <i className="watermark">{watermark}</i>
    <B
      sx={{
        position: "absolute",
        bottom: "0",
        width: "100%",
        background: "linear-gradient(rgba(0,0,0,0.5),black)",
        px: 2,
        py: 1,
        display: "flex",
        gap: 2,
        color: "white",
        zIndex: 1000,
        alignItems: "center",
      }}
      component={"div"}
    >

      {/* Backward 10s Button */}
      <IBT
        color="inherit"
        size="small"
        onClick={handleBackward10}
      >
        <Replay10Icon />
      </IBT>


      <IBT
        color="inherit"
        size="small"
        onClick={() => {
          if (isPlyV) {
            vdrf.current.pause();
          } else {
            vdrf.current.play();
          }
        }}
      >
        {isPlyV ? <Pause /> : <PlayArrow />}
      </IBT>

      {/* Forward 10s Button */}
      <IBT
        color="inherit"
        size="small"
        onClick={handleForward10}
      >
        <Forward10Icon />
      </IBT>

      <Sl
        color="error"
        className="vdslider"
        min={0}
        max={duration}
        step={0.1}
        value={cTV}
        onChange={hSCF}
        size="small"
        ref={slrf}
      />
      <T>{new Date(cTV * 1000).toISOString().substr(11, 8)}</T>

      <IBT
        color="inherit"
        size="small"
        sx={{
          position: "relative",
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
        <T
          variant="body"
          sx={{
            fontSize: "12px",
            position: "absolute",
            bottom: "-5px",
          }}
        >
          {speed}x
        </T>
        <FastForward />
      </IBT>
      <IBT
        color="inherit"
        size="small"
        onClick={() => {
          if (fhandle.active) {
            fhandle.exit();
          } else {
            fhandle.enter();
          }
        }}
      >
        {fhandle.active ? <FullscreenExit /> : <Fullscreen />}
      </IBT>
    </B>
    <T
      sx={{
        position: "absolute",
        top: "4px",
        left: "8px",
        color: "#f4f4f4",
        backdropFilter: "blur(5px)",
        cursor: "pointer",
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
