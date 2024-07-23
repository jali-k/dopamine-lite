import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import {
  Box as B,
  IconButton as IBT,
  Slider as Sl,
  Typography as T,
  CircularProgress as CP,
} from '@mui/material';
import {
  FastForward,
  Fullscreen,
  FullscreenExit,
  Pause,
  PlayArrow,
} from '@mui/icons-material';
import {
  FullScreen as FSC,
  useFullScreenHandle as uFSC,
} from 'react-full-screen';

const CVPL = ({ watermark, url }) => {
  const fhandle = uFSC();
  const playerRef = useRef(null);
  const [isPlyV, setPlyV] = useState(false);
  const [cTV, setCTV] = useState(0);
  const [duration, setDV] = useState(0);
  const [loading, setLoading] = useState(true);
  const [speed, setSpeed] = useState(1);
  const speeds = [0.5, 1, 1.5, 2];

  const handleProgress = (state) => {
    setLoading(false);
    setCTV(state.playedSeconds);
  };

  const handleDuration = (duration) => {
    setDV(duration);
  };

  const handleSliderChange = (e, newValue) => {
    const newTime = Array.isArray(newValue) ? newValue[0] : newValue;
    playerRef.current.seekTo(newTime, 'seconds');
    setCTV(newTime);
  };

  const handleSpeedChange = () => {
    const newSpeed = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    if (playerRef.current) {
      playerRef.current.getInternalPlayer().playbackRate = newSpeed;
    }
    setSpeed(newSpeed);
  };

  const handlePlayPause = () => {
    if (isPlyV) {
      playerRef.current.getInternalPlayer().pause();
    } else {
      playerRef.current.getInternalPlayer().play();
    }
    setPlyV(!isPlyV);
  };

  return (
    <FSC handle={fhandle}>
      <B
        sx={{
          position: 'relative',
          overflow: 'hidden',
          width: fhandle.active ? '100vw' : '100%',
          height: fhandle.active ? '100vh' : 'fit-content',
          display: 'flex',
        }}
        onDoubleClick={() => {
          if (fhandle.active) {
            fhandle.exit();
          } else {
            fhandle.enter();
          }
        }}
      >
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={isPlyV}
          controls={false}
          onPlay={() => setPlyV(true)}
          onPause={() => setPlyV(false)}
          onProgress={handleProgress}
          onDuration={handleDuration}
          playbackRate={speed}
          width="100%"
          height="100%"
          style={{
            backgroundColor: 'black',
            borderRadius: fhandle.active ? '0px' : '6px',
          }}
        />
        {loading && (
          <B
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontSize: '30px',
              fontWeight: 'bold',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CP color="inherit" />
          </B>
        )}
        <i className="watermark">{watermark}</i>
        <B
          sx={{
            position: 'absolute',
            bottom: '0',
            width: '100%',
            background: 'linear-gradient(rgba(0,0,0,0.5),black)',
            px: 2,
            py: 1,
            display: 'flex',
            gap: 2,
            color: 'white',
            zIndex: 1000,
            alignItems: 'center',
          }}
          component={'div'}
        >
          <IBT color="inherit" size="small" onClick={handlePlayPause}>
            {isPlyV ? <Pause /> : <PlayArrow />}
          </IBT>
          <Sl
            color="error"
            min={0}
            max={duration}
            step={0.1}
            value={cTV}
            onChange={handleSliderChange}
            size="small"
          />
          <T>{new Date(cTV * 1000).toISOString().substr(11, 8)}</T>
          <IBT color="inherit" size="small" onClick={handleSpeedChange}>
            <T
              variant="body"
              sx={{
                fontSize: '12px',
                position: 'absolute',
                bottom: '-5px',
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
            position: 'absolute',
            top: '4px',
            left: '8px',
            color: '#f4f4f4',
            backdropFilter: 'blur(5px)',
            cursor: 'pointer',
          }}
        >
          {/* Your custom text here */}
        </T>
      </B>
    </FSC>
  );
};

export default CVPL;
