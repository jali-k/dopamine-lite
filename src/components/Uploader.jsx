/* eslint-disable react/prop-types */
import { Paper as P, Stack as St, Typography as T } from "@mui/material";
import { CloudUpload, PictureAsPdf } from "@mui/icons-material";
import { useState, useEffect } from "react";

export default function Uploader({
  text = "Upload the file",
  type = "thumbnails", // "thumbnails", "videos", or "pdfs"
  helperText = "Cannot be empty",
  onChange,
  inerror = false,
  name = "file",
  currentFileUrl = null,
  currentFileName = null,
  optional = false
}) {
  const [selectedfile, setSelectedfile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    // Set preview URL when there's a current file
    if (currentFileUrl && !selectedfile) {
      setPreviewUrl(currentFileUrl);
      setPreviewError(false);
    }
  }, [currentFileUrl, selectedfile]);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedfile(file);
      setPreviewUrl(URL.createObjectURL(file));
      onChange && onChange(file);
    } else {
      setSelectedfile(null);
      setPreviewUrl(currentFileUrl); // Revert to current file if no new file selected
    }
  };

  const renderPreview = () => {
    if (!selectedfile && !previewUrl) {
      return <CloudUpload sx={{ fontSize: "30px" }} color={inerror ? "error" : "primary"} />;
    }

    if (type === "videos") {
      return (
        <video
          width={150}
          height={150}
          style={{ objectFit: "cover", borderRadius: "10px" }}
          src={selectedfile ? URL.createObjectURL(selectedfile) : previewUrl}
          controls
        />
      );
    }

    if (type === "pdfs") {
      return (
        <PictureAsPdf
          sx={{ fontSize: "60px", color: "red" }}
          titleAccess="PDF file selected"
        />
      );
    }

    // For images
    return (
      <img
        width={150}
        height={150}
        style={{ objectFit: "cover", borderRadius: "10px" }}
        src={selectedfile ? URL.createObjectURL(selectedfile) : previewUrl}
        alt={selectedfile ? selectedfile.name : currentFileName || "Preview"}
        onError={() => setPreviewError(true)}
      />
    );
  };

  return (
    <P
      sx={{
        border: "2px dashed #8888f4",
        borderColor: inerror ? "red" : "primary.main",
        borderRadius: "10px",
        px: { xs: 2, sm: 4 },
        py: 2,
        display: "flex",
        gap: 2,
        mx: 2,
        overflow: "hidden",
        justifyContent: "center",
        position: "relative",
        cursor: "pointer"
      }}
      component={"div"}
      onClick={() => {
        document.querySelector(`.${name}`).click();
      }}
    >
      <St direction="column" alignItems={"center"} spacing={1}>
        <T variant="h6" fontWeight={"bold"}>
          {text}
        </T>

        {renderPreview()}

        <p style={{ textAlign: "left", fontSize: "14px" }}>
          {selectedfile
            ? selectedfile.name
            : currentFileName
              ? `Current: ${currentFileName}`
              : "Click here"}
        </p>
      </St>

      <input
        type="file"
        hidden
        accept={
          type === "videos"
            ? "video/*"
            : type === "pdfs"
              ? "application/pdf"
              : "image/*"
        }
        onChange={handleFileInput}
        required={!optional && !currentFileUrl}
        className={name}
      />
      {inerror && (
        <T
          component="p"
          color={"error"}
          sx={{
            position: "absolute",
            bottom: 0,
            fontSize: "12px",
          }}
        >
          {helperText}
        </T>
      )}
    </P>
  );
}