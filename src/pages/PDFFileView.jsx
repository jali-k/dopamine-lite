import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Typography, 
  Card, 
  CardActionArea, 
  CardContent,
  Box
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection, query, where } from "firebase/firestore";
import { fireDB } from "../../firebaseconfig";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import { Description as PdfIcon } from '@mui/icons-material';

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
        backgroundColor: '#f4f4f4',
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
        

        <Grid container spacing={3} sx={{
          py: 2, flex: 1, margin: 0, width: "100%" }} backgroundColor="#eeeeee">
          {pdfs && pdfs.length > 0 ? (
            pdfs.map((pdf, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                 
                  elevation={3}
                  sx={{ 
              
                    display: 'flex', 
                    flexDirection: 'column' 
                  }}
                >
                  <CardActionArea 
                    component={Link}
                    to={`/pdf/${params.fname}/${pdf.title}`} 
                    target="_blank"
                    sx={{ 
                      flexGrow: 1,
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <PdfIcon 
                        sx={{ 
                          fontSize: 60, 
                          color: 'primary.main',
                          mb: 2 
                        }} 
                      />
                      <Typography variant="h6">
                        {pdf.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="textSecondary"
                      >
                        {pdf.description || 'No description'}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12} textAlign="center">
              <Typography variant="h6" color="textSecondary">
                No PDFs Found in this Folder
              </Typography>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}