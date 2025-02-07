import FVAdPage from "./pages/FVAdPage";
import { Outlet, Route, Routes } from "react-router-dom";
import VideoUPPage from "./pages/VideoUPPage";
import PDFUploaderPage from "./pages/PDFUploaderPage";
import FVStuPage from "./pages/FVStuPage";
import StuFileView from "./pages/StuFileView";
import VideoPage from "./pages/VideoPage";
import AdmFileView from "./pages/AdmFileView";
import AdmPDFFileView from "./pages/AdmPDFFileView";
import ADVideoPage from "./pages/ADVideoPage";
import Error404 from "./pages/Error404";
import AdminButton from "./components/AdminButton";
import PDFFileView from "./pages/PDFFileView";
import PDFPage from "./pages/PDFPage";
import EditTutorialPage from "./pages/EditTutorialPage"; // New import
import BrowserDetection from "./components/BrowserDetectionComponent";
import { ThemeProvider, createTheme } from '@mui/material';
import KeyPressTracker from "./components/KeyPressTracker";

const theme = createTheme();

export default function App() {
  return (
    <ThemeProvider theme={theme}>
    <BrowserDetection>
    <KeyPressTracker />
      <Routes>
        <Route
          element={
            <>
              <AdminButton />
              <Outlet />
            </>
          }
        >
          {/* Student routes */}
          <Route path="/" element={<FVStuPage />} />
          <Route path="/video" element={<FVStuPage />} />
          <Route path="/pdf" element={<FVStuPage />} />
          <Route path="/video/:fname" element={<StuFileView />} />
          <Route path="/video/:fname/:lname" element={<VideoPage />} />
          <Route path="/pdf/:fname" element={<PDFFileView />} />
          <Route path="/pdf/:fname/:lname" element={<PDFPage />} />

          {/* Admin routes */}
          <Route path="/admin" element={<FVAdPage />} />
          <Route path="/admin/video" element={<FVAdPage />} />
          <Route path="/admin/video/:fname/add" element={<VideoUPPage />} />
          <Route path="/admin/video/:fname" element={<AdmFileView />} />
          <Route path="/admin/video/:fname/:lname" element={<ADVideoPage />} />
          <Route path="/admin/video/:fname/edit/:tname" element={<EditTutorialPage />} />
          <Route path="/admin/pdf" element={<FVAdPage />} />
          <Route path="/admin/pdf/:fname/add" element={<PDFUploaderPage />} />
          <Route path="/admin/pdf/:fname" element={<AdmPDFFileView />} />
          <Route path="/admin/pdf/:fname/:lname" element={<PDFPage />} />

          <Route path="*" element={<Error404 />} />
        </Route>
      </Routes>
    </BrowserDetection>
    </ThemeProvider>
  );
}