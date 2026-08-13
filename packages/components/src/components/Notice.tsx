import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import type { ElementType } from "react";
import { CustomIcon } from "./CustomIcon";

export type NoticeType = "info" | "warning" | "error";
export type NoticeId = string | number;

export interface NoticeItem {
  id: NoticeId;
  type: NoticeType;
  message: string;
  isRead: boolean;
  timestamp: string;
}

export interface NoticeProps {
  notice: NoticeItem;
  locale?: string;
  deleteLabel?: string;
  onDelete: (id: NoticeId) => void;
}

const noticeIcons: Record<NoticeType, ElementType> = {
  error: CancelOutlinedIcon,
  warning: ReportProblemOutlinedIcon,
  info: InfoOutlinedIcon,
};

const isSameLocalDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const formatNoticeTimestamp = (
  timestamp: string,
  locale?: string,
  now = new Date()
): string | null => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  const options: Intl.DateTimeFormatOptions = isSameLocalDay(date, now)
    ? {hour: "2-digit", minute: "2-digit"}
    : {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };

  return new Intl.DateTimeFormat(locale, options).format(date);
};

export const Notice = (
  {notice, locale, deleteLabel = "Delete", onDelete}: NoticeProps
) => {
  const {id, type, isRead, message, timestamp} = notice;
  const Icon = noticeIcons[type];
  const formattedTimestamp = formatNoticeTimestamp(timestamp, locale);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        minHeight: 112,
        py: 1.5,
        pr: 1.5,
        pl: 1.25,
        borderBottom: 1,
        borderColor: "divider",
        transition: "background-color 0.4s ease-out",
        "&:hover": {bgcolor: "action.hover"},
      }}
    >
      <Box sx={{display: "flex", alignItems: "center", width: 54, flexShrink: 0}}>
        <Box sx={{width: 14, flexShrink: 0}}>
          {!isRead ? (
            <Box
              aria-label="unread"
              sx={{width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main"}}
            />
          ) : null}
        </Box>
        <Icon
          sx={(theme: Theme) => ({
            width: 40,
            height: 40,
            p: 0.5,
            borderRadius: 1,
            color: theme.palette[type].main,
          })}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignSelf: "stretch",
          minWidth: 0,
          flex: 1,
        }}
      >
        <Typography
          className="text-14"
          color={isRead ? "text.secondary" : "text.primary"}
          sx={{overflowWrap: "anywhere"}}
        >
          {message}
        </Typography>
        {formattedTimestamp ? (
          <Typography className="text-14" color="text.secondary">
            {formattedTimestamp}
          </Typography>
        ) : null}
      </Box>

      <IconButton
        aria-label={deleteLabel}
        data-id="notification-delete-button"
        onClick={() => onDelete(id)}
        sx={{width: 40, height: 40, flexShrink: 0}}
      >
        <CustomIcon Icon={CloseOutlinedIcon} color="textSecondary" />
      </IconButton>
    </Box>
  );
};
