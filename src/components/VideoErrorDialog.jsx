import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

const VideoErrorDialog = ({ open, onClose }) => {
  const handleReload = () => {
    window.location.reload();
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: { xs: '90%', sm: '400px' }
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        Security Check Failed
      </DialogTitle>
      <DialogContent sx={{ pb: 2 }}>
        <Typography variant="body1">
          Unable to verify video security. This might be due to network issues or the content being unavailable.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleReload}
        >
          Retry
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VideoErrorDialog;