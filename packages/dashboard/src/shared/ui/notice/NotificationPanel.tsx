import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import Box from "@mui/material/Box";
import clsx from "clsx";
import { FC } from "react";
import { connect, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { routes, tabs } from "src/shared/utils/enums";
import { setIsNotificationPanelOpen, TAppSlice } from "../../lib/appSlice";
import {
  deleteAllNotices,
  setIsReadNotice,
  TNotice,
} from "../../lib/noticesSlice";
import { RootState } from "../../../app/store/store";
import { Typography } from "@mui/material";
import { IconWithTooltip } from "../components/IconWithTooltip";
import { SidePanel } from "src/shared/ui/sidePanel/SidePanel";
import { Notice } from "./Notice";
import styles from "./NotificationPanel.module.css";

interface INotificationPanelProps {
  isNotificationPanelOpen: TAppSlice["isNotificationPanelOpen"];
  notices: TNotice[];
}

const mapStateToProps = (state: RootState) => ({
  isNotificationPanelOpen: state.app.isNotificationPanelOpen,
  notices: state.notices.notices,
});

const NotificationPanelComponent: FC<INotificationPanelProps> = ({
  isNotificationPanelOpen,
  notices,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t: translate } = useTranslation();
  const newNotices = notices?.filter((notice) => notice.isRead === false);

  const handleClosePanel = () => {
    dispatch(setIsNotificationPanelOpen(false));
    dispatch(setIsReadNotice(true));
  };
  const removeAllNotices = () => dispatch(deleteAllNotices());

  const goToPageEventLogs = () => {
    handleClosePanel();
    navigate(`/${routes.profile}/${tabs.eventLog}`);
  };

  return (
    <SidePanel
      title={translate("panel.notification.title")}
      onClose={handleClosePanel}
      isOpen={isNotificationPanelOpen}
      customStyles={styles.drawerPaper}
    >
      <Box className={styles.wrapper}>
        <Box className={styles.topBar}>
          <div className={styles.topBarText}>
            <Typography className="text-17">
              {translate("panel.notification.newNotifications")}
            </Typography>
            <Typography
              color="accent"
              className={clsx("text-17", styles.topBarCount)}
            >
              {newNotices?.length || "0"}
            </Typography>
          </div>
          <div className={styles.topBarButtons}>
            <IconWithTooltip
              Icon={DeleteOutlineOutlinedIcon}
              onClick={removeAllNotices}
              title={translate("panel.notification.clear")}
            />
            <IconWithTooltip
              Icon={OpenInNewOutlinedIcon}
              onClick={goToPageEventLogs}
              title={translate("panel.notification.goToLog")}
            />
          </div>
        </Box>
        <div className={styles.notices} data-id="notification-panel-notices">
          {notices?.map((notice) => (
            <Notice notice={notice} key={notice.id} />
          ))}
        </div>
      </Box>
    </SidePanel>
  );
};

export const NotificationPanel = connect(mapStateToProps)(
  NotificationPanelComponent
);
