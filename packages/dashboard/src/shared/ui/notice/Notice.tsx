import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import clsx from "clsx";
import { FC } from "react";
import { useDispatch } from "react-redux";
import { ENoticeType } from "src/shared/utils/enums";
import { deleteNotice, TNotice } from "../../lib/noticesSlice";
import { Typography } from "@mui/material";
import styles from "./Notice.module.css";

interface INoticeProps {
  notice: TNotice;
}

export const Notice: FC<INoticeProps> = ({ notice }) => {
  const dispatch = useDispatch();
  const { id, type, isRead, message, timestamp } = notice;

  const getTime = () => {
    const timestampDate = new Date(timestamp);
    const time = `${String(timestampDate.getHours()).padStart(2, "0")}:${String(
      timestampDate.getMinutes()
    ).padStart(2, "0")}`;
    const timestampDay = timestampDate.getDate();
    const currentDay = new Date().getDate();

    if (timestampDay == currentDay) {
      return (
        <Typography className="text-14" color="text.secondary">
          {time}
        </Typography>
      );
    } else {
      return (
        <Typography className="text-14" color="text.secondary">
          {`${timestampDay.toLocaleString()} : ${time}`}
        </Typography>
      );
    }
  };

  const removeNotice = (id: number) => dispatch(deleteNotice(id));

  return (
    <Box className={styles.notice}>
      <div className={styles.icons}>
        <div className={styles.markerWrapper}>
          {!isRead && <div className={styles.marker}></div>}
        </div>
        {type === ENoticeType.error && (
          <CancelOutlinedIcon className={clsx(styles.icon, styles.iconError)} />
        )}
        {type === ENoticeType.warning && (
          <ReportProblemOutlinedIcon
            className={clsx(styles.icon, styles.iconWarning)}
          />
        )}
        {type === ENoticeType.info && (
          <InfoOutlinedIcon className={clsx(styles.icon, styles.iconInfo)} />
        )}
      </div>
      <div className={styles.textWrapper}>
        <Typography
          color={isRead ? "custom.mainGrey" : undefined}
          className={clsx("text-14", styles.text)}
        >
          {message}
        </Typography>
        {timestamp && getTime()}
      </div>
      <IconButton
        className={styles.button}
        data-id="side-panel-close-button"
        onClick={() => removeNotice(id)}
      >
        <CloseOutlinedIcon />
      </IconButton>
    </Box>
  );
};
