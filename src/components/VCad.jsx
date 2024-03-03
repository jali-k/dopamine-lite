/* eslint-disable react/prop-types */
import { Box, Button, Skeleton, Tooltip, Typography } from "@mui/material";
import { useDownloadURL } from "react-firebase-hooks/storage";
import { fireStorage } from "../../firebaseconfig";
import { ref } from "firebase/storage";
import { Error } from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

export default function VCad({ tut }) {
  const [url, loading, error] = useDownloadURL(
    ref(fireStorage, `thumbnails/${tut.fpath}/${tut.title}/${tut.thumbnail}`)
  );

  const navigator = useNavigate();

  return (
    <Tooltip
      title={
        tut.description.length > 100
          ? tut.description.slice(0, 100) + "..."
          : tut.description
      }
    >
      <Button
        sx={{
          position: "relative",
        }}
        disableElevation
        onClick={() => {
          //   navigator(`/${tut.fpath}/${tut.title}`);
          navigator(`${tut.title}`);
        }}
      >
        <Box
          sx={{
            aspectRatio: "16/9",
            width: { xs: "100%", sm: "90%", md: "300px" },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {loading ? (
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              sx={{ borderRadius: "10px" }}
            />
          ) : error ? (
            <Box
              variant="rectangular"
              width="100%"
              height="100%"
              sx={{
                borderRadius: "10px",
                position: "relative",
                border: "1px solid #f8d775",
              }}
              component={"div"}
              onClick={() => window.location.reload()}
            >
              <Error
                sx={{
                  position: "absolute",
                  color: "error.main",
                  fontSize: "30px",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            </Box>
          ) : (
            <Box
              component={"img"}
              src={url}
              sx={{
                width: "100%",
                height: "100%",
                borderRadius: "10px",
                objectFit: "cover",
                border: "1px solid #d7c664",
              }}
            />
          )}
          <Typography variant="h7" sx={{ mt: 1, color: "GrayText" }}>
            {tut.title}
          </Typography>
        </Box>
      </Button>
    </Tooltip>
  );
}
