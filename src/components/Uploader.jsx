/* eslint-disable react/prop-types */
import { Paper as P, Stack as St, Typography as T } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import { useState } from "react";

export default function Uploader({
  text = "Upload the image file",
  type = "thumbnails",
  helperText = "Cannot be empty",
  onChange,
  inerror = false,
  name = "file",
}) {
  const [selectedfile, setSelectedfile] = useState(null);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedfile(file);
      onChange && onChange(file);
    } else {
      setSelectedfile(null);
    }
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

        {selectedfile ? (
          type === "videos" ? (
            <video
              width={150}
              height={150}
              style={{ objectFit: "cover", borderRadius: "10px" }}
              src={URL.createObjectURL(selectedfile)}
              controls
            />
          ) : (
            <img
              width={150}
              height={150}
              style={{ objectFit: "cover", borderRadius: "10px" }}
              src={URL.createObjectURL(selectedfile)}
            />
          )
        ) : (
          <CloudUpload sx={{ fontSize: "30px" }} color="primary" />
        )}

        <p style={{ textAlign: "left", fontSize: "14px" }}>
          {selectedfile ? selectedfile.name : `Click here`}
        </p>
      </St>

      <input
        type="file"
        hidden
        accept={type === "videos" ? "video/*" : "image/*"}
        onChange={handleFileInput}
        required
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
