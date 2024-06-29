import Hls from 'hls.js';
import {
  FastForward,
  Fullscreen,
  FullscreenExit,
  Pause,
  PlayArrow,
} from "@mui/icons-material";
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

export default function CVPL({ watermark, url }) {
  const fhandle = uFSC();
  const vdrf = uR(null);
  const slrf = uR(null);
  const animationRef = uR(null);

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
    cancelAnimationFrame(animationRef.current);
    const newTime = parseFloat(e.target.value);
    vdrf.current.currentTime = newTime;
    stCTV(newTime);
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

  const fetchWithRetry = async (url, maxRetries, delay = 1000) => {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return response;
        } else {
          retries++;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Failed to fetch manifest after several retries.');
  };

  const fetchManifest = async () => {
    try {
      const response = await fetchWithRetry(url, 3);
      const data = await response.json();
      const modifiedManifest = data.modified_m3u8_content;

      if (Hls.isSupported()) {
        const hls = new Hls();
        const blob = new Blob([modifiedManifest], { type: 'application/x-mpegURL' });
        const blobUrl = URL.createObjectURL(blob);
        hls.loadSource(blobUrl);
        hls.attachMedia(vdrf.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          vdrf.current.play();
        });
      } else if (vdrf.current.canPlayType('application/vnd.apple.mpegurl')) {
        vdrf.current.src = data.manifest_url;
        vdrf.current.addEventListener('loadedmetadata', () => {
          setLoading(false);
          vdrf.current.play();
        });
      }
    } catch (error) {
      console.error('Error fetching manifest:', error);
    }
  };

  uE(() => {
    fetchManifest();
    const intervalId = setInterval(fetchManifest, 55 * 60 * 1000); // Refresh manifest every 55 minutes

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
            32, 80, 111, 119, 101, 114, 101, 100, 32, 98, 121, 32, 68, 97, 115,
            97, 32, 71, 97, 109, 101, 115, 32, 83, 116, 117, 100, 105, 111,
          ])}
        </T>
      </B>
    </FSC>
  );
}
