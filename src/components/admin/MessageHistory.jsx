import {
    Box as Bx,
    Paper,
    Typography as T,
    Divider,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button as B,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    IconButton,
    InputAdornment,
    TextField as Tf,
    LinearProgress,
} from "@mui/material";
import {
    Email,
    History,
    DeleteForever,
    RemoveRedEye,
    Search,
    CheckCircle,
    ErrorOutline,
    Warning,
    Send,
    Close
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { fireDB } from "../../../firebaseconfig";
import MessagePreview from "./MessagePreview";
import { format } from "date-fns";

export default function MessageHistory() {
    const [messageHistory, setMessageHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [confirmResendOpen, setConfirmResendOpen] = useState(false);

    useEffect(() => {
        const fetchMessageHistory = async () => {
            try {
                setLoading(true);
                // Create the messageHistory collection if it doesn't exist yet - for first-time setup
                const historyRef = collection(fireDB, "messageHistory");

                // Check if collection exists by attempting to query it
                try {
                    const q = query(historyRef, orderBy("sentAt", "desc"));
                    const querySnapshot = await getDocs(q);

                    const messages = [];
                    querySnapshot.forEach((doc) => {
                        // Handle case where sentAt might not be a Timestamp
                        let sentAt = new Date();
                        if (doc.data().sentAt) {
                            sentAt = doc.data().sentAt.toDate ? doc.data().sentAt.toDate() : new Date(doc.data().sentAt);
                        }

                        messages.push({
                            id: doc.id,
                            ...doc.data(),
                            sentAt: sentAt,
                        });
                    });

                    setMessageHistory(messages);
                } catch (err) {
                    console.log("Message history collection may not exist yet:", err);
                    // This is fine for first-time setup
                    setMessageHistory([]);
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching message history:", err);
                setError("Failed to load message history");
                setLoading(false);
            }
        };

        fetchMessageHistory();
    }, []);

    const handleViewMessage = (message) => {
        setSelectedMessage(message);
        setPreviewOpen(true);
    };

    const handleDeleteMessage = async () => {
        if (!messageToDelete) return;

        try {
            setLoading(true);
            await deleteDoc(doc(fireDB, "messageHistory", messageToDelete.id));

            // Update local state
            setMessageHistory(messageHistory.filter(msg => msg.id !== messageToDelete.id));
            setConfirmDeleteOpen(false);
            setMessageToDelete(null);
            setLoading(false);
        } catch (err) {
            console.error("Error deleting message:", err);
            setError("Failed to delete message");
            setLoading(false);
        }
    };
    
    const handleResendMessage = async () => {
        if (!selectedMessage) return;
        
        try {
            setLoading(true);
            setConfirmResendOpen(false);
            setPreviewOpen(false);
            
            // Create a new entry in messageQueue to trigger Cloud Function
            const messageQueueRef = collection(fireDB, "messageQueue");
            await addDoc(messageQueueRef, {
                title: selectedMessage.title,
                body: selectedMessage.body,
                recipients: selectedMessage.recipients,
                sentBy: selectedMessage.sentBy || "admin@sddopamine.com",
                fromEmail: selectedMessage.fromEmail || "payments@em1004.sddopamine.com",
                status: "queued",
                queuedAt: serverTimestamp(),
                progress: 0,
                successCount: 0,
                failureCount: 0,
            });
            
            setLoading(false);
            
            // Refresh message history list
            const historyRef = collection(fireDB, "messageHistory");
            const q = query(historyRef, orderBy("sentAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            const messages = [];
            querySnapshot.forEach((doc) => {
                let sentAt = new Date();
                if (doc.data().sentAt) {
                    sentAt = doc.data().sentAt.toDate ? doc.data().sentAt.toDate() : new Date(doc.data().sentAt);
                }
                
                messages.push({
                    id: doc.id,
                    ...doc.data(),
                    sentAt: sentAt,
                });
            });
            
            setMessageHistory(messages);
            
        } catch (err) {
            console.error("Error resending message:", err);
            setError("Failed to resend message");
            setLoading(false);
        }
    };

    const filteredMessages = messageHistory.filter(message =>
        message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.body.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Bx>
            <Paper sx={{ p: 3, mb: 2 }}>
                <T variant="h5" gutterBottom>Message History</T>

                {/* Search Bar */}
                <Tf
                    fullWidth
                    placeholder="Search messages..."
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ mb: 3 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />

                {loading && <LinearProgress sx={{ mb: 2 }} />}

                {error && (
                    <Paper
                        variant="outlined"
                        sx={{ p: 2, mb: 2, bgcolor: "error.light" }}
                    >
                        <T color="error">{error}</T>
                    </Paper>
                )}

                {!loading && filteredMessages.length === 0 && (
                    <Bx
                        sx={{
                            textAlign: "center",
                            py: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2
                        }}
                    >
                        <History sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                        {searchTerm ? (
                            <T variant="body1" color="text.secondary">
                                No messages match your search criteria
                            </T>
                        ) : (
                            <T variant="body1" color="text.secondary">
                                No message history found. Start sending messages to see them here.
                            </T>
                        )}
                    </Bx>
                )}

                <Grid container spacing={2}>
                    {filteredMessages.map((message) => (
                        <Grid item xs={12} md={6} lg={4} key={message.id}>
                            <Card
                                variant="outlined"
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <CardContent sx={{ flex: 1 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                        <T variant="h6" noWrap>{message.title}</T>

                                        <Chip
                                            label={`${message.recipients?.length || 0} recipients`}
                                            size="small"
                                            color="primary"
                                            icon={<Email fontSize="small" />}
                                        />
                                    </Stack>

                                    <Divider sx={{ my: 1 }} />

                                    <T
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mb: 2,
                                            display: '-webkit-box',
                                            overflow: 'hidden',
                                            WebkitBoxOrient: 'vertical',
                                            WebkitLineClamp: 3,
                                        }}
                                    >
                                        {message.body}
                                    </T>

                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <T variant="caption" color="text.secondary">
                                            Sent: {format(message.sentAt, "MMM d, yyyy 'at' h:mm a")}
                                        </T>
                                    </Stack>

                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                        {message.successCount > 0 && (
                                            <Chip
                                                icon={<CheckCircle fontSize="small" />}
                                                label={`${message.successCount} sent`}
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                            />
                                        )}
                                        {message.failureCount > 0 && (
                                            <Chip
                                                icon={<ErrorOutline fontSize="small" />}
                                                label={`${message.failureCount} failed`}
                                                size="small"
                                                color="error"
                                                variant="outlined"
                                            />
                                        )}
                                        <Chip
                                            label={message.status || "sent"}
                                            color={
                                                message.status === "queued" ? "warning" :
                                                    message.status === "processing" ? "info" :
                                                        message.status === "completed" ? "success" :
                                                            "default"
                                            }
                                            size="small"
                                            sx={{ ml: 1 }}
                                        />
                                    </Stack>
                                </CardContent>

                                <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                                    <B
                                        startIcon={<RemoveRedEye />}
                                        onClick={() => handleViewMessage(message)}
                                        size="small"
                                    >
                                        View
                                    </B>

                                    <B
                                        startIcon={<DeleteForever />}
                                        color="error"
                                        onClick={() => {
                                            setMessageToDelete(message);
                                            setConfirmDeleteOpen(true);
                                        }}
                                        size="small"
                                    >
                                        Delete
                                    </B>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Message Preview Dialog */}
            {/* Message Preview Dialog */}
<Dialog
  open={previewOpen}
  onClose={() => setPreviewOpen(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>
    Message Details
    <IconButton
      aria-label="close"
      onClick={() => setPreviewOpen(false)}
      sx={{
        position: 'absolute',
        right: 8,
        top: 8,
        color: (theme) => theme.palette.grey[500],
      }}
    >
      <Close />
    </IconButton>
  </DialogTitle>
  <DialogContent>
    {selectedMessage && (
      <Bx>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <T variant="body2">
            <strong>Sent:</strong> {format(selectedMessage.sentAt, "PPpp")}
          </T>
          <T variant="body2">
            <strong>Recipients:</strong> {selectedMessage.recipients?.length || 0}
          </T>
        </Stack>

        <MessagePreview
          title={selectedMessage.title}
          body={selectedMessage.body} // Original body with preserved whitespace
          student={selectedMessage.recipients?.[0]}
        />

        {selectedMessage.recipients?.length > 0 && (
          <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
            <T variant="subtitle1" gutterBottom>Recipients</T>
            <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
              {selectedMessage.recipients.map((recipient, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Email fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={recipient.name}
                    secondary={
                      <>
                        {recipient.email}
                        {recipient.registration && (
                          <span style={{ display: 'block' }}>
                            Reg: {recipient.registration}
                          </span>
                        )}
                      </>
                    }
                  />
                  {recipient.status === 'failed' ? (
                    <Chip
                      label="Failed"
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      label="Sent"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Bx>
    )}
  </DialogContent>
  <DialogActions sx={{ justifyContent: 'flex-start', p: 2 }}>
    <B
      color="error"
      variant="contained"
      startIcon={<Send />}
      onClick={() => setConfirmResendOpen(true)}
    >
      Resend
    </B>
  </DialogActions>
</Dialog>

            {/* Confirm Delete Dialog */}
            <Dialog
                open={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <T variant="body1">
                        Are you sure you want to delete this message history? This action cannot be undone.
                    </T>
                </DialogContent>
                <DialogActions>
                    <B onClick={() => setConfirmDeleteOpen(false)}>Cancel</B>
                    <B color="error" onClick={handleDeleteMessage}>Delete</B>
                </DialogActions>
            </Dialog>
            
            {/* Confirm Resend Dialog */}
            <Dialog
                open={confirmResendOpen}
                onClose={() => setConfirmResendOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Confirm Resend</DialogTitle>
                <DialogContent>
                    <T variant="body1">
                        Are you sure you want to resend this message to {selectedMessage?.recipients?.length || 0} recipients?
                    </T>
                </DialogContent>
                <DialogActions>
                    <B onClick={() => setConfirmResendOpen(false)}>Cancel</B>
                    <B color="error" onClick={handleResendMessage}>Resend</B>
                </DialogActions>
            </Dialog>
        </Bx>
    );
}