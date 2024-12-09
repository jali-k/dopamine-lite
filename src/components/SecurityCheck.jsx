import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { Shield, CheckCircle, Lock, Security, VerifiedUser } from '@mui/icons-material';
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";

const SecurityCheckUI = ({ progress, hasError }) => {
  const [currentPhase, setCurrentPhase] = useState(0);

  const securityPhases = [
    { icon: <Lock sx={{ fontSize: 28 }} />, text: "Verifying session..." },
    { icon: <Shield sx={{ fontSize: 28 }} />, text: "Checking authentication..." },
    { icon: <Security sx={{ fontSize: 28 }} />, text: "Validating access rights..." },
    { icon: <VerifiedUser sx={{ fontSize: 28 }} />, text: "Securing connection..." }
  ];

  useEffect(() => {
    if (!hasError) {  // Only update phase if there's no error
      if (progress < 25) setCurrentPhase(0);
      else if (progress < 50) setCurrentPhase(1);
      else if (progress < 75) setCurrentPhase(2);
      else if (progress < 100) setCurrentPhase(3);
    }
  }, [progress, hasError]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3
      }}
    >
      <div style={{ width: 200, height: 200, position: 'relative' }}>
        <CircularProgressbar
          value={progress}
          text={`${Math.round(progress)}%`}
          styles={buildStyles({
            textSize: '24px',
            textColor: '#fff',
            pathColor: '#4caf50',
            trailColor: 'rgba(255, 255, 255, 0.2)',
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
            opacity: 0.2,
          }}
        >
          {securityPhases[currentPhase].icon}
        </Box>
      </div>

      <Box sx={{ textAlign: 'center' }}>
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
              mb: 1,
              color: currentPhase >= index ? '#fff' : 'rgba(255,255,255,0.5)',
              transition: 'color 0.3s ease'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                opacity: currentPhase >= index ? 1 : 0.5,
              }}
            >
              {phase.icon}
              {currentPhase > index && <CheckCircle sx={{ fontSize: 16, ml: 0.5, color: '#4caf50' }} />}
            </Box>
            <Typography
              variant="body1"
              sx={{
                transition: 'opacity 0.3s ease',
                opacity: currentPhase >= index ? 1 : 0.5,
              }}
            >
              {phase.text}
            </Typography>
            {currentPhase === index && (
              <CircularProgress size={16} sx={{ ml: 1 }} />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SecurityCheckUI;