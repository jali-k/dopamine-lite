import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Box,
  Paper
} from '@mui/material';
import {
  Description as PdfIcon,
  BiotechOutlined,
  Science
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection, query, where } from "firebase/firestore";
import { fireDB } from "../../firebaseconfig";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import { useUser } from "../contexts/UserProvider";

export default function PDFFileView() {
  const params = useParams();
  const pdfRef = collection(fireDB, "pdfFolders", params.fname, "pdfs");
  const emailListref = collection(
    fireDB,
    "pdfFolders",
    params.fname,
    "emailslist"
  );

  const { user, isAdmin } = useUser();

  const [pdfs, loading] = useCollectionData(pdfRef);
  const [emails, emailLoading] = useCollectionData(emailListref);

  // ============================================================
  const handleDownloadPdf = async (pdf) => {
    try {
      if (!pdf.url) {
        alert("PDF file URL is missing.");
        return;
      }
  
      const formData = new FormData();
      formData.append("email", encodeURIComponent(user.email));
  
      // Fetch the original PDF file from Firebase
      const response = await fetch(pdf.url);
      if (!response.ok) throw new Error("Failed to fetch original PDF");
  
      const blob = await response.blob();
      const file = new File([blob], pdf.title, { type: "application/pdf" });
      formData.append("pdf", file);
  
      // Send file and email to Django service
      const uploadResponse = await fetch("", {
      // const uploadResponse = await fetch("http://54.172.123.83/api/edit-pdf/", {
        method: "POST",
        body: formData,
      });
  
      if (!uploadResponse.ok) {
        throw new Error("Failed to generate watermarked PDF");
      }
  
      // Receive and download the modified PDF
      const pdfBlob = await uploadResponse.blob();
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
  
      // Create a download link
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.setAttribute("download", `${pdf.title}-watermarked.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("Failed to load the PDF. Please try again.");
    }
  };
  
  // =============================================================  

  if (loading) {
    return <Loading text="Loading PDFs" />;
  }
  if (emailLoading) {
    return <Loading text="Checking Emails" />;
  }

  if (isAdmin) {
    emails.push({ email: user.email });
    console.log("giving access to admin: ", user.email);
  }

  if (emails && emails.length > 0) {
    if (!emails.find((email) => email.email === user.email)) {
      return (
        <NavLink
          to="/"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            textDecoration: "none",
          }}
        >
          <Typography
            color="error.main"
            textAlign="center"
            variant="h6"
            sx={{
              backgroundColor: 'error.light',
              padding: 3,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(211, 47, 47, 0.2)'
            }}
          >
            You are not authorized to view this page. Click here to go back
          </Typography>
        </NavLink>
      );
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: 'background.default',
        display: "flex"
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          py: { xs: 2, sm: 4 },
          px: { xs: 1, sm: 2 }
        }}
      >
        <Appbar />

        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 2,
            borderRadius: 2,
            bgcolor: 'customColors.cytoplasm',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <BiotechOutlined sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4">
            {params.fname} Documents
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          {pdfs && pdfs.length > 0 ? (
            pdfs.map((pdf, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 4px 20px rgba(46, 125, 50, 0.15)',
                    }
                  }}
                >
                  <CardActionArea
                    onClick={() => handleDownloadPdf(pdf)}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 3
                    }}
                  >
                    <PdfIcon
                      sx={{
                        fontSize: 64,
                        color: 'error.main',
                        mb: 2
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'Quicksand, Arial, sans-serif',
                        fontWeight: 600,
                        color: 'primary.main'
                      }}
                    >
                      {pdf.title}
                    </Typography>
                    {pdf.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {pdf.description}
                      </Typography>
                    )}
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Card
                sx={{
                  textAlign: 'center',
                  py: 6,
                  backgroundColor: 'customColors.cytoplasm',
                  border: '1px dashed',
                  borderColor: 'primary.main'
                }}
              >
                <CardContent>
                  <Science sx={{ fontSize: 48, color: 'primary.main', opacity: 0.7, mb: 2 }} />
                  <Typography variant="h6" color="primary">
                    No PDFs Found in this Folder
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}