import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { Shield, CheckCircle, Lock, Security, VerifiedUser } from '@mui/icons-material';
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";

const SecurityCheckUI = ({ progress, hasError }) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [thresholds, setThresholds] = useState([]);

  // Generate random thresholds on mount
  useEffect(() => {
    const generateThresholds = () => {
      let values = [];
      let minGap = 15; // Minimum gap between thresholds
      let prevValue = 0;

      for (let i = 0; i < 3; i++) {
        // Generate random value with minimum gap, ensuring it doesn't exceed 90 for last threshold
        const maxPossible = i === 2 ? 90 : 100 - ((3 - i) * minGap);
        const minPossible = prevValue + minGap;
        const value = Math.floor(Math.random() * (maxPossible - minPossible)) + minPossible;
        values.push(value);
        prevValue = value;
      }
      values.push(100); // Final threshold is always 100
      return values;
    };

    setThresholds(generateThresholds());
  }, []);

  const securityPhases = [
    {
      icon: <Lock sx={{ fontSize: 48 }} />,
      text: "Verifying session...",
      color: '#2e7d32', // Darker green
      glow: 'rgba(46, 125, 50, 0.6)'
    },
    {
      icon: <Shield sx={{ fontSize: 48 }} />,
      text: "Checking authentication...",
      color: '#43a047', // Slightly brighter
      glow: 'rgba(67, 160, 71, 0.6)'
    },
    {
      icon: <Security sx={{ fontSize: 48 }} />,
      text: "Validating access rights...",
      color: '#4caf50', // Even brighter
      glow: 'rgba(76, 175, 80, 0.6)'
    },
    {
      icon: <VerifiedUser sx={{ fontSize: 48 }} />,
      text: "Securing connection...",
      color: '#66bb6a', // Brightest
      glow: 'rgba(102, 187, 106, 0.7)'
    }
  ];

  useEffect(() => {
    if (!hasError && thresholds.length > 0) {
      if (progress < thresholds[0]) setCurrentPhase(0);
      else if (progress < thresholds[1]) setCurrentPhase(1);
      else if (progress < thresholds[2]) setCurrentPhase(2);
      else setCurrentPhase(3);
    }
  }, [progress, hasError, thresholds]);

  if (thresholds.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        color: '#fff'
      }}
    >
      <div style={{
        width: 200,
        height: 200,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgressbar
          value={progress}
          styles={buildStyles({
            rotation: 0,
            strokeLinecap: 'round',
            pathColor: securityPhases[currentPhase].color,
            trailColor: 'rgba(255, 255, 255, 0.2)',
            pathTransitionDuration: 0.5,
          })}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            transition: 'all 0.5s ease',
            '& svg': {
              transition: 'all 0.3s ease',
              filter: `drop-shadow(0 0 15px ${securityPhases[currentPhase].color})
              drop-shadow(0 0 25px ${securityPhases[currentPhase].color})`, // Enhanced glow
              opacity: 0.9 // Slightly reduce opacity to make glow more visible
            }
          }}
        >
          {securityPhases[currentPhase].icon}
        </Box>
      </div>

      <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 300 }}>
        <Typography variant="h6" sx={{ mb: 2, color: hasError ? '#ff1744' : 'inherit' }}>
          {hasError ? 'Security Check Failed' : 'Performing Security Checks'}
        </Typography>

        {securityPhases.map((phase, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1.5,
              color: currentPhase >= index ? '#fff' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.3s ease'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                opacity: currentPhase >= index ? 1 : 0.5,
                minWidth: 32,
              }}
            >
              {React.cloneElement(phase.icon, {
                sx: {
                  fontSize: 28,
                  color: currentPhase >= index ? phase.color : 'inherit',
                  transition: 'all 0.3s ease'
                }
              })}
              {currentPhase > index && (
                <CheckCircle
                  sx={{
                    fontSize: 16,
                    ml: 0.5,
                    color: phase.color,
                    filter: `drop-shadow(0 0 2px ${phase.glow})`
                  }}
                />
              )}
            </Box>
            <Typography
              variant="body1"
              sx={{
                transition: 'opacity 0.3s ease',
                opacity: currentPhase >= index ? 1 : 0.5,
                flex: 1,
                textAlign: 'left'
              }}
            >
              {phase.text}
              {currentPhase === index && (
                <Typography
                  component="span"
                  sx={{
                    ml: 1,
                    color: phase.color,
                    fontWeight: 'bold'
                  }}
                >
                  {Math.round(progress)}%
                </Typography>
              )}
            </Typography>
            {currentPhase === index && (
              <CircularProgress
                size={16}
                sx={{
                  ml: 1,
                  color: phase.color
                }}
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SecurityCheckUI;