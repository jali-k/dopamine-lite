/* eslint-disable react/prop-types */
import {
  IconButton as TBT,
  Tooltip as TP,
  Typography as T,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import { useNavigate as uNV } from "react-router-dom";

export default function FButton({ fname = "Untitled", to = "/" }) {
  const hCMF = (e) => {
    e.preventDefault();
  };

  const nv = uNV();
  return (
    <TP title={fname}>
      <TBT
        onContextMenu={hCMF}
        size="large"
        sx={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
        onClick={() => {
          nv(to);
        }}
      >
        <FolderIcon sx={{ fontSize: "80px", color: "#F8D775" }} />
        <T
          sx={{
            textAlign: "center",
            position: "absolute",
            top: "85px",
            //  transform: "translate(0%,-5px)",
          }}
        >
          {fname}
        </T>
      </TBT>
    </TP>
  );
}
