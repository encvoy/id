import SentimentDissatisfiedOutlinedIcon from "@mui/icons-material/SentimentDissatisfiedOutlined";
import { FC } from "react";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";

export const Error: FC = () => {
  const { text } = useParams<{ text: string }>();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
      }}
    >
      <SentimentDissatisfiedOutlinedIcon
        sx={{ width: "120px", height: "120px" }}
      />
      {text}
    </Box>
  );
};
