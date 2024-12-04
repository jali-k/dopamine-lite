import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button,
  Paper
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from "firebase/firestore";
import { fireDB } from "../../firebaseconfig";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";

export default function PDFPage() {
  const { fname, lname } = useParams();
  const [pdfDetails, setPdfDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchPdfDetails = async () => {
      try {
        const pdfDocRef = doc(fireDB, "pdfs", `${fname}_${lname}`);
        const pdfDoc = await getDoc(pdfDocRef);
        
        if (pdfDoc.exists()) {
          setPdfDetails(pdfDoc.data());
        }
      } catch (error) {
        console.error("Error fetching PDF details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPdfDetails();
  }, [fname, lname]);

  if (loading) {
    return <Loading text="Loading PDF Details" />;
  }

  if (!pdfDetails) {
    return (
      <Container 
        sx={{ 
          minHeight: '100vh', 
          backgroundColor: '#e6f3e6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant="h6" color="error">
          PDF Not Found
        </Typography>
      </Container>
    );
  }

  return (
    <Box 
      sx={{
        minHeight: "100vh",
        backgroundColor: '#e6f3e6',
        py: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 0 }
      }}
    >
      <Container 
        maxWidth="lg"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <Appbar />
        
        <Paper 
          elevation={3} 
          sx={{ 
            backgroundColor: 'white', 
            p: { xs: 2, sm: 4 },
            mt: { xs: 2, sm: 4 },
            borderRadius: 2 
          }}
        >
          <Box sx={{ 
            textAlign: 'center', 
            mb: 4 
          }}>
            <Typography variant="h4" gutterBottom>
              {lname}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {pdfDetails.description || 'No description available'}
            </Typography>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 4 
          }}>
            <Button 
              variant="contained" 
              color="primary" 
              href={pdfDetails.url} 
              target="_blank"
            >
              Open PDF
            </Button>
          </Box>

          {pdfDetails.additionalInfo && (
            <Box sx={{ 
              backgroundColor: '#f0f8f0', 
              p: 3, 
              borderRadius: 2 
            }}>
              <Typography variant="h6">Additional Information</Typography>
              <Typography variant="body1">
                {pdfDetails.additionalInfo}
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}