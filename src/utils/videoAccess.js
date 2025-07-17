import { doc, getDoc } from "firebase/firestore";
import { fireDB } from "../../firebaseconfig";

/**
 * Centralized video access logic
 * Determines whether to use cookie-based or legacy authentication
 */

export const checkVideoStatus = async (tutorialHandler) => {
  try {
    console.log("Checking video status for handler:", tutorialHandler);
    const videoDocRef = doc(fireDB, "videos", tutorialHandler);
    const videoDocSnap = await getDoc(videoDocRef);
    
    if (videoDocSnap.exists()) {
      const videoData = videoDocSnap.data();
      console.log("Video document data:", videoData);
      return videoData.status === 'completed';
    } else {
      console.log("No video document found for handler:", tutorialHandler);
      return false;
    }
  } catch (error) {
    console.error("Error checking video status:", error);
    return false;
  }
};

export const determineVideoAccessMethod = async (tutorialData) => {
  if (!tutorialData || !tutorialData.handler) {
    console.warn("No handler available for video");
    return {
      method: 'none',
      handler: null,
      url: null
    };
  }

  // Check if this is a new converted video
  const isNewVideo = await checkVideoStatus(tutorialData.handler);
  
  if (isNewVideo) {
    console.log("🆕 Using cookie-based authentication for new video:", tutorialData.handler);
    return {
      method: 'cookie',
      handler: tutorialData.handler,
      url: null
    };
  } else {
    console.log("🔐 Using legacy authentication for video:", tutorialData.handler);
    // Generate presigned URL for legacy videos
    const BASE_URL = import.meta.env.VITE_GET_PRESIGN_URL_FUNCTION;
    const url = `${BASE_URL}?manifest_key=index.m3u8&segment_keys=index0.ts,index1.ts&folder=${tutorialData.handler}&expiration=28800`;
    
    return {
      method: 'legacy',
      handler: tutorialData.handler,
      url: url
    };
  }
};

export const getVideoPlayerProps = (accessMethod, userEmail, canPlay = true) => {
  switch (accessMethod.method) {
    case 'cookie':
      return {
        url: null,
        videoHandler: accessMethod.handler,
        useCookieAuth: true,
        watermark: userEmail,
        canPlay: canPlay
      };
    
    case 'legacy':
      return {
        url: accessMethod.url,
        videoHandler: null,
        useCookieAuth: false,
        watermark: userEmail,
        canPlay: canPlay
      };
    
    default:
      return {
        url: null,
        videoHandler: null,
        useCookieAuth: false,
        watermark: userEmail,
        canPlay: false
      };
  }
};
