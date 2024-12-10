import React from 'react';
import { Link } from 'react-router-dom';
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

export default function PDFFileView() {
 const params = useParams();
  const pdfRef = collection(fireDB, "pdfFolders", params.fname, "pdfs");
  const emailListref = collection(
    fireDB,
    "pdfFolders",
    params.fname,
    "emailslist"
  );

  const [pdfs, loading] = useCollectionData(pdfRef);



  if (loading) {
    return <Loading text="Loading PDFs" />;
  }
  console.log(pdfs);

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
                    component={Link}
                    to={pdf.url}
                    target="_blank"
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