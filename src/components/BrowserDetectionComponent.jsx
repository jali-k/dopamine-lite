import React, { useEffect, useState } from 'react';
import { 
  Alert, 
  AlertTitle,
  Box,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography 
} from '@mui/material';
import BrowserIcon from '@mui/icons-material/Language';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/Warning';

const BrowserDetection = ({ children }) => {
  const [isSupported, setIsSupported] = useState(true);
  const [browserInfo, setBrowserInfo] = useState({ name: '', platform: '', version: '' });

  useEffect(() => {
    // Get user agent and platform info
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    
    // Comprehensive UC Browser detection
    const isUCBrowser = (
      /ucbrowser|ubrowser|uc browser/i.test(userAgent) || 
      /ucweb|UC_/i.test(userAgent) ||
      /UBrowser/.test(navigator.userAgent) ||
      typeof UCBrowser !== 'undefined'
    );
    
    // Platform detection
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent);
    const isWindows = /windows/.test(platform);
    const isMobile = isIOS || isAndroid || /mobile/i.test(userAgent);
    
    // Browser detection
    const isChrome = /chrome|chromium|crios/i.test(userAgent) && !/edg|opr/i.test(userAgent);
    const isFirefox = /firefox|fxios/i.test(userAgent);
    const isSafari = /safari/i.test(userAgent) && !/chrome|chromium|edg|opr/i.test(userAgent);
    const isEdge = /edg/i.test(userAgent);
    const isOpera = /opr/i.test(userAgent);
    const isSamsung = /samsungbrowser/i.test(userAgent);
    
    // iOS specific browsers
    const isIOSChrome = /crios/i.test(userAgent);
    const isIOSFirefox = /fxios/i.test(userAgent);
    
    // Determine browser name and platform
    let browserName = '';
    let platformType = isMobile ? 'mobile' : 'desktop';
    
    if (isUCBrowser) {
      browserName = isWindows ? 'UC Browser (Windows)' : 'UC Browser (Mobile)';
    } else if (isEdge) browserName = 'Edge';
    else if (isOpera) browserName = 'Opera';
    else if (isIOSChrome) browserName = 'Chrome iOS';
    else if (isIOSFirefox) browserName = 'Firefox iOS';
    else if (isSamsung) browserName = 'Samsung Internet';
    else if (isChrome) browserName = 'Chrome';
    else if (isFirefox) browserName = 'Firefox';
    else if (isSafari) browserName = 'Safari';
    else browserName = 'Unknown Browser';

    setBrowserInfo({ 
      name: browserName, 
      platform: platformType,
      isIOS,
      isAndroid,
      isWindows
    });
    
    // Support check logic
    if (isUCBrowser) {
      setIsSupported(false);
    } else if (platformType === 'mobile') {
      if (isIOS) {
        // iOS: Allow Safari and iOS versions of Chrome/Firefox
        setIsSupported(isSafari || isIOSChrome || isIOSFirefox);
      } else {
        // Android: Allow Chrome, Firefox, and Samsung Internet
        setIsSupported(isChrome || isFirefox || isSamsung);
      }
    } else {
      // Desktop: Allow Chrome, Firefox, and Safari
      setIsSupported(isChrome || isFirefox || isSafari);
    }
  }, []);

  if (!isSupported) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          p: 2
        }}
      >
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ p: 3 }}>
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              iconMapping={{
                error: browserInfo.name.includes('UC Browser') ? <BlockIcon /> : <WarningIcon />
              }}
            >
              <AlertTitle>Unsupported Browser</AlertTitle>
              {browserInfo.name.includes('UC Browser') ? (
                <>
                  UC Browser is not supported on {browserInfo.isWindows ? 'Windows' : 'mobile devices'}. 
                  Please use one of our supported browsers below.
                </>
              ) : (
                `You're currently using ${browserInfo.name} on a ${browserInfo.platform} device, which is not supported.`
              )}
            </Alert>
            
            <Typography variant="body1" gutterBottom>
              Please use one of these supported browsers:
            </Typography>
            
            <List>
              {browserInfo.platform === 'mobile' ? (
                // Mobile supported browsers
                <>
                  {browserInfo.isIOS ? (
                    // iOS devices
                    <>
                      <ListItem>
                        <ListItemIcon><PhoneIphoneIcon /></ListItemIcon>
                        <ListItemText primary="Safari (iOS)" secondary="Recommended for best performance" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PhoneIphoneIcon /></ListItemIcon>
                        <ListItemText primary="Chrome (iOS)" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PhoneIphoneIcon /></ListItemIcon>
                        <ListItemText primary="Firefox (iOS)" />
                      </ListItem>
                    </>
                  ) : (
                    // Android devices
                    <>
                      <ListItem>
                        <ListItemIcon><PhoneIphoneIcon /></ListItemIcon>
                        <ListItemText primary="Chrome (Android)" secondary="Recommended for best performance" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PhoneIphoneIcon /></ListItemIcon>
                        <ListItemText primary="Firefox (Android)" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PhoneIphoneIcon /></ListItemIcon>
                        <ListItemText primary="Samsung Internet" />
                      </ListItem>
                    </>
                  )}
                </>
              ) : (
                // Desktop supported browsers
                <>
                  <ListItem>
                    <ListItemIcon><BrowserIcon /></ListItemIcon>
                    <ListItemText primary="Google Chrome" secondary="Recommended for best performance" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><BrowserIcon /></ListItemIcon>
                    <ListItemText primary="Mozilla Firefox" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><BrowserIcon /></ListItemIcon>
                    <ListItemText primary="Safari" />
                  </ListItem>
                </>
              )}
            </List>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              For the best experience, we recommend using the latest version of your chosen browser.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return children;
};

export default BrowserDetection;