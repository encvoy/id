import { FC } from "react";
import Button from "@mui/material/Button";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import PostAddOutlinedIcon from "@mui/icons-material/PostAddOutlined";
import { CustomIcon } from "src/shared/ui/components/CustomIcon";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface IEmptyProvidersProps {
  title: string;
  onClick: () => void;
}

export const EmptyProviders: FC<IEmptyProvidersProps> = ({
  title,
  onClick,
}) => {
  const { t: translate } = useTranslation();

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CustomIcon
        sx={{ width: "50px", height: "50px" }}
        Icon={SearchOutlinedIcon}
        color="textSecondary"
      />
      <Typography
        className="text-17"
        sx={{ marginBottom: "16px" }}
        color="text.secondary"
      >
        {translate("helperText.emptyList")}
      </Typography>
      <Typography
        color="text.secondary"
        className="text-14"
        sx={{ marginBottom: "16px" }}
      >
        {title}
      </Typography>
      <Button
        onClick={onClick}
        variant="contained"
        className="text-14"
        color="secondary"
        startIcon={<PostAddOutlinedIcon />}
      >
        {translate("actionButtons.create")}
      </Button>
    </Box>
  );
};
