import {
  Box,
  Button,
  Skeleton,
  Tooltip,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Stack
} from "@mui/material";
import {
  Error as ErrorIcon,
  BiotechOutlined as BiotechIcon,
  PlayCircleOutline as PlayIcon,
  VideoLibrary as VideoIcon
} from "@mui/icons-material";
import { useDownloadURL } from "react-firebase-hooks/storage";
import { fireStorage } from "../../firebaseconfig";
import { ref } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { Colors } from "../themes/colours";

export default function VCad({ tut }) {
  const [url, loading, error] = useDownloadURL(
    ref(fireStorage, `thumbnails/${tut.fpath}/${tut.title}/${tut.thumbnail}`)
  );

  const navigator = useNavigate();

  const handleClick = () => {
    navigator(`${tut.title}`);
  };

  return (
    <Tooltip
      title={
        tut.description.length > 100
          ? tut.description.slice(0, 100) + "..."
          : tut.description
      }
      placement="top"
      arrow
    >
      <Card
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'background.paper',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 20px rgba(46, 125, 50, 0.15)',
            '& .play-icon': {
              opacity: 1,
              transform: 'translate(-50%, -50%) scale(1.1)',
            }
          }
        }}
      >
        <CardActionArea
          onClick={handleClick}
          sx={{ height: '100%' }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: "16/9",
              borderBottom: '1px solid',
              borderColor: 'customColors.membrane'
            }}
          >
            {loading ? (
              <Skeleton
                variant="rectangular"
                width="100%"
                height="100%"
                animation="wave"
              />
            ) : error ? (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'error.light',
                  gap: 1,
                  p: 2
                }}
                onClick={() => window.location.reload()}
              >
                <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                <Typography
                  variant="caption"
                  color="error"
                  align="center"
                >
                  Failed to load thumbnail
                  Click to retry
                </Typography>
              </Box>
            ) : (
              <>
                <Box
                  component="img"
                  src={url}
                  alt={tut.title}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                {/* Play button overlay */}
                <Box
                  className="play-icon"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: 0,
                    transition: 'all 0.2s ease-in-out',
                    bgcolor: 'rgba(46, 125, 50, 0.9)',
                    borderRadius: '50%',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PlayIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
              </>
            )}
          </Box>

          <CardContent sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <VideoIcon
                  sx={{
                    fontSize: 20,
                    color: Colors.green,
                    opacity: 0.8
                  }}
                />
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 500,
                    color: 'text.primary',
                    lineHeight: 1.2
                  }}
                >
                  {tut.title}
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  overflow: 'hidden',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                }}
              >
                {tut.lesson || "Biology Tutorial"}
              </Typography>
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>
    </Tooltip>
  );
}