import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { CustomIcon } from "./CustomIcon";
import { Notice, type NoticeId, type NoticeItem } from "./Notice";
import { SidePanel } from "./SidePanel";

export interface NotificationPanelLabels {
  title: string;
  newNotifications: string;
  clear: string;
  empty: string;
  delete: string;
}

export interface NotificationPanelProps {
  isOpen: boolean;
  notices: NoticeItem[];
  labels: NotificationPanelLabels;
  locale?: string;
  onClose: () => void;
  onClear: () => void;
  onDelete: (id: NoticeId) => void;
}

export const NotificationPanel = (
  {
    isOpen,
    notices,
    labels,
    locale,
    onClose,
    onClear,
    onDelete,
  }: NotificationPanelProps
) => {
  const unreadCount = notices.filter((notice) => !notice.isRead).length;

  return (
    <SidePanel
      title={labels.title}
      onClose={onClose}
      isOpen={isOpen}
      paperSx={{
        width: "100%",
        maxWidth: 460,
        px: 2.5,
        pt: 4,
        pb: 3,
      }}
    >
      <Box sx={{height: "calc(100vh - 118px)"}}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            pb: 1.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{display: "flex", alignItems: "baseline", minWidth: 0}}>
            <Typography className="text-17">
              {labels.newNotifications}
            </Typography>
            <Typography className="text-17" color="primary" sx={{mx: 0.75}}>
              {unreadCount}
            </Typography>
          </Box>
          <Tooltip title={labels.clear} arrow>
            <span>
              <IconButton
                aria-label={labels.clear}
                data-test-id="btn-notifications-clear"
                disabled={notices.length === 0}
                onClick={onClear}
              >
                <CustomIcon
                  Icon={DeleteOutlineOutlinedIcon}
                  color="textSecondary"
                />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <Box
          data-id="notification-panel-notices"
          sx={{height: "calc(100vh - 172px)", overflowY: "auto"}}
        >
          {notices.length > 0 ? (
            notices.map((notice) => (
              <Notice
                key={notice.id}
                notice={notice}
                locale={locale}
                deleteLabel={labels.delete}
                onDelete={onDelete}
              />
            ))
          ) : (
            <Typography
              className="text-14"
              color="text.secondary"
              sx={{py: 3, textAlign: "center"}}
            >
              {labels.empty}
            </Typography>
          )}
        </Box>
      </Box>
    </SidePanel>
  );
};
