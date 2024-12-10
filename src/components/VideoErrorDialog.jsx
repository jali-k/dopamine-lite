import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack
} from "@mui/material";
import {
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  BiotechOutlined as BiotechIcon
} from '@mui/icons-material';

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
          minWidth: { xs: '90%', sm: '400px' },
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'customColors.cytoplasm',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <BiotechIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <DialogTitle sx={{ p: 0, fontSize: '1.25rem' }}>
          Content Access Issue
        </DialogTitle>
      </Box>

      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: 'error.light',
              p: 2,
              borderRadius: 1
            }}
          >
            <WarningIcon color="error" />
            <Typography color="error.dark" fontWeight={500}>
              Security Verification Failed
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary">
            We're having trouble verifying the security of this content. This could be due to:
          </Typography>

          <Box component="ul" sx={{ mt: 0, pl: 3 }}>
            <Typography component="li" variant="body1" color="text.secondary">
              Network connectivity issues
            </Typography>
            <Typography component="li" variant="body1" color="text.secondary">
              Temporary server unavailability
            </Typography>
            <Typography component="li" variant="body1" color="text.secondary">
              Content access restrictions
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          bgcolor: 'background.default',
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          sx={{
            textTransform: 'none',
            mr: 1
          }}
        >
          Close
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleReload}
          startIcon={<RefreshIcon />}
          sx={{
            textTransform: 'none',
            px: 3
          }}
        >
          Try Again
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VideoErrorDialog;