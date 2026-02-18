import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import { CustomContentProps, SnackbarContent, useSnackbar } from "notistack";
import { forwardRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ENoticeType } from "src/shared/utils/enums";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { Typography } from "@mui/material";
import { setIsNotificationPanelOpen } from "../shared/lib/appSlice";
import { RootState } from "./store/store";

interface ISnackbarProps extends CustomContentProps {
  message?: string;
  snackbarVariant: ENoticeType;
}

export const Snackbar = forwardRef<HTMLDivElement, ISnackbarProps>(
  ({ message, snackbarVariant }, ref) => {
    const dispatch = useDispatch();
    const { isNotificationPanelOpen } = useSelector(
      (state: RootState) => state.app
    );

    const { closeSnackbar } = useSnackbar();

    const onPanelIconClick = () => {
      dispatch(setIsNotificationPanelOpen(!isNotificationPanelOpen));
      closeSnackbar();
    };

    return (
      <SnackbarContent ref={ref} onClick={onPanelIconClick}>
        <Card
          sx={{
            display: "flex",
            maxWidth: "400px",
            padding: "24px",
            alignItems: "center",
            borderRadius: "6px",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          }}
        >
          {snackbarVariant === ENoticeType.error && (
            <CancelOutlinedIcon
              sx={{ width: "32px", height: "32px", color: "rgb(255, 62, 62)" }}
            />
          )}
          {snackbarVariant === ENoticeType.warning && (
            <ReportProblemOutlinedIcon
              sx={{ width: "32px", height: "32px", color: "rgb(255, 217, 49)" }}
            />
          )}
          {snackbarVariant === ENoticeType.info && (
            <InfoOutlinedIcon
              sx={{ width: "32px", height: "32px", color: "rgb(60, 60, 255)" }}
            />
          )}
          <Typography
            className="text-14"
            sx={{
              width: "100%",
              marginLeft: "14px",
              marginRight: "24px",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {message}
          </Typography>
          <IconButton
            sx={{ padding: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              closeSnackbar();
            }}
          >
            <CloseOutlinedIcon />
          </IconButton>
        </Card>
      </SnackbarContent>
    );
  }
);

Snackbar.displayName = "Snackbar";
