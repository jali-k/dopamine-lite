import FVAdPage from "./pages/FVAdPage";
import { Outlet, Route, Routes } from "react-router-dom";
import VideoUPPage from "./pages/VideoUPPage";
import FVStuPage from "./pages/FVStuPage";
import StuFileView from "./pages/StuFileView";
import VideoPage from "./pages/VideoPage";
import AdmFileView from "./pages/AdmFileView";
import ADVideoPage from "./pages/ADVideoPage";
import Error404 from "./pages/Error404";
import AdminButton from "./components/AdminButton";
import { Box, Typography } from "@mui/material";

export default function App() {
  return (
    <Routes>
      <Route
        element={
          <>
            <AdminButton />
            <Outlet />
          </>
        }
      >
        <Route path="/admin" element={<FVAdPage />} />
        <Route path="/" element={<FVStuPage />} />
        <Route path="/admin/:fname/add" element={<VideoUPPage />}></Route>
        <Route path="/admin/:fname" element={<AdmFileView />}></Route>
        <Route path="/:fname" element={<StuFileView />}></Route>
        <Route path="/:fname/:lname" element={<VideoPage />}></Route>
        <Route path="/admin/:fname/:lname" element={<ADVideoPage />}></Route>
        <Route path="*" element={<Error404 />} />
      </Route>
    </Routes>
  );
}
