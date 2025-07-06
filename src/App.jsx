import FVAdPage from "./pages/FVAdPage";
import { Outlet, Route, Routes, Navigate, useParams  } from "react-router-dom";
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
import EditTutorialPage from "./pages/EditTutorialPage";
import BrowserDetection from "./components/BrowserDetectionComponent";
import { ThemeProvider, createTheme } from '@mui/material';
import KeyPressTracker from "./components/KeyPressTracker";
import NetworkStatus from "./components/NetworkStatus";
import MessageCenter from "./pages/admin/MessageCenter";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EmailValidatorPage from "./pages/admin/EmailValidatorPage"; // Import the new EmailValidator component
import StudentDashboard from "./pages/StudentDashboard"; // Import the new StudentDashboard component
import NotificationCenterPage from "./pages/admin/NotificationCenterPage"; // Import the existing NotificationCenter component
import PersonalizedNotificationCenter from "./pages/admin/PersonalizedNotificationCenter"; // Import the new PersonalizedNotificationCenter component
import NotificationPage from "./pages/NotificationPage"; // Import the student notification page
import PersonalizedNotificationPage from "./pages/PersonalizedNotificationPage"; // Import the new PersonalizedNotificationPage component
import PersonalizedNotificationViewPage from "./pages/PersonalizedNotificationViewPage"; 
import NotificationViewPage from "./pages/NotificationViewPage";
const theme = createTheme();

export default function App() {
  function RedirectToVideo() {
    const { fname } = useParams();
    return <Navigate to={`/video/${fname}`} />;
  }
  
  return (
    <ThemeProvider theme={theme}>
    <BrowserDetection>
    <KeyPressTracker />
    <NetworkStatus>
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
          <Route path="/" element={<StudentDashboard />} />
          <Route path="/video" element={<FVStuPage />} />
          <Route path="/pdf" element={<FVStuPage />} />
          <Route path="/video/:fname" element={<StuFileView />} />
          <Route path="/:fname" element={<RedirectToVideo />} />
          <Route path="/video/:fname/:lname" element={<VideoPage />} />
          <Route path="/pdf/:fname" element={<PDFFileView />} />
          <Route path="/pdf/:fname/:lname" element={<PDFPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/notifications/:id" element={<NotificationViewPage />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/video" element={<FVAdPage />} />
          <Route path="/admin/video/:fname/add" element={<VideoUPPage />} />
          <Route path="/admin/video/:fname" element={<AdmFileView />} />
          <Route path="/admin/video/:fname/:lname" element={<VideoPage />} />
          <Route path="/admin/video/:fname/edit/:tname" element={<EditTutorialPage />} />
          <Route path="/admin/pdf" element={<FVAdPage />} />
          <Route path="/admin/pdf/:fname/add" element={<PDFUploaderPage />} />
          <Route path="/admin/pdf/:fname" element={<AdmPDFFileView />} />
          <Route path="/admin/pdf/:fname/:lname" element={<PDFPage />} />
          
          {/* Message Center routes */}
          <Route path="/admin/messages" element={<MessageCenter />} />
          <Route path="/admin/messages/history" element={<MessageCenter />} />
          <Route path="/admin/messages/templates" element={<MessageCenter />} />
          
          {/* Original Notification Center routes */}
          <Route path="/admin/notifications" element={<NotificationCenterPage />} />
          <Route path="/admin/notifications/history" element={<NotificationCenterPage />} />
          
          {/* NEW: Personalized Notification Center routes */}
          <Route path="/personalizednotifications" element={<PersonalizedNotificationPage />} />
          <Route path="/personalizednotifications/:id" element={<PersonalizedNotificationViewPage />} />
          <Route path="/admin/personalizednotifications" element={<PersonalizedNotificationCenter />} />
          <Route path="/admin/personalizednotifications/history" element={<PersonalizedNotificationCenter />} />
          <Route path="/admin/personalizednotifications/templates" element={<PersonalizedNotificationCenter />} />
          
          {/* Email Validator route */}
          <Route path="/admin/email-validator" element={<EmailValidatorPage />} />

          <Route path="*" element={<Error404 />} />
        </Route>
      </Routes>
      </NetworkStatus>
    </BrowserDetection>
    </ThemeProvider>
  );
}