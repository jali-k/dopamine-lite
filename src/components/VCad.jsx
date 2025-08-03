import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Stack,
  Chip
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDownloadURL } from "react-firebase-hooks/storage";
import { ref } from "firebase/storage";
import { fireStorage } from "../../firebaseconfig";
import { 
  HighQuality, 
  CheckCircle,
  HourglassEmpty,
  Lock
} from "@mui/icons-material";

export default function VCad({ tut }) {
  const navigate = useNavigate();
  
  const [thumbnailURL, loading, error] = useDownloadURL(
    ref(fireStorage, `thumbnails/${tut.fpath}/${tut.title}/${tut.thumbnail}`)
  );

  // Check if we're on admin page to determine what to show
  const isAdminPage = window.location.pathname.includes('/admin');

  const handleClick = () => {
    // Legacy videos are always clickable
    // New videos are only clickable if completed/processed
    if (tut.isLegacyVideo || tut.videoStatus === 'completed' || tut.videoStatus === 'processed') {
      // Check if we're on admin or student page
      const isAdminPage = window.location.pathname.includes('/admin');
      if (isAdminPage) {
        navigate(`/admin/video/${tut.fpath}/${tut.title}`);
      } else {
        navigate(`/video/${tut.fpath}/${tut.title}`);
      }
    }
  };

  const isClickable = tut.isLegacyVideo || tut.videoStatus === 'completed' || tut.videoStatus === 'processed';

  // Status chip configuration
  const getStatusChip = () => {
    if (tut.videoStatus === 'completed' || tut.videoStatus === 'processed') {
      return (
        <Chip
          icon={<CheckCircle />}
          label="Completed"
          size="small"
          sx={{
            backgroundColor: '#4caf50',
            color: 'white',
            fontWeight: 'bold',
            '& .MuiChip-icon': {
              color: 'white'
            }
          }}
        />
      );
    } else {
      return (
        <Chip
          icon={<HourglassEmpty />}
          label="Processing"
          size="small"
          sx={{
            backgroundColor: '#ff9800',
            color: 'white',
            fontWeight: 'bold',
            '& .MuiChip-icon': {
              color: 'white'
            }
          }}
        />
      );
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        cursor: isClickable ? 'pointer' : 'default',
        opacity: isClickable ? 1 : 0.7,
        transition: 'all 0.2s ease-in-out',
        '&:hover': isClickable ? {
          transform: 'translateY(-2px)',
          boxShadow: 3
        } : {},
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
      onClick={handleClick}
    >
      {/* Status Badge - show based on user type and video status */}
      {!tut.isLegacyVideo && (
        (isAdminPage && tut.videoStatus) || // Admin: show all statuses
        (!isAdminPage && tut.videoStatus === 'processing') // Student: only show processing (not completed/processed)
      ) && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1
          }}
        >
          {getStatusChip()}
        </Box>
      )}

      {/* Thumbnail */}
      <CardMedia
        component="img"
        height="200"
        image={thumbnailURL || "/api/placeholder/400/200"}
        alt={tut.title}
        sx={{
          objectFit: 'cover',
          backgroundColor: 'grey.100'
        }}
      />

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack spacing={1} sx={{ flex: 1 }}>
          {/* Title */}
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 'bold',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {tut.title}
          </Typography>

          {/* Lesson */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            📚 {tut.lesson}
          </Typography>

          {/* Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              flex: 1,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {tut.description}
          </Typography>

          {/* Bottom info */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto' }}>
            <Typography variant="body2" color="text.secondary">
              📅 {tut.date?.replaceAll("-", "/")}
            </Typography>
            
            {/* Video type indicator - show for all completed/processed non-legacy videos */}
            {!tut.isLegacyVideo && (tut.videoStatus === 'completed' || tut.videoStatus === 'processed') && (
              <Chip
                icon={tut.isEncrypted ? <Lock /> : <HighQuality />}
                label={tut.isEncrypted ? "Stream Protected" : "Multi-Quality"}
                size="small"
                sx={{
                  backgroundColor: tut.isEncrypted ? '#9c27b0' : '#4caf50',
                  color: 'white',
                  border: tut.isEncrypted ? '1px solid #9c27b0' : '1px solid #4caf50',
                  '& .MuiChip-icon': {
                    color: 'white'
                  }
                }}
              />
            )}
          </Stack>
        </Stack>
      </CardContent>

      {/* Processing overlay for non-completed, non-legacy videos */}
      {!tut.isLegacyVideo && tut.videoStatus !== 'completed' && tut.videoStatus !== 'processed' && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1
          }}
        >
          <Typography
            variant="body2"
            sx={{
              backgroundColor: 'rgba(255, 152, 0, 0.9)',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 1,
              fontWeight: 'bold'
            }}
          >
            Video is Processing...
          </Typography>
        </Box>
      )}
    </Card>
  );
}