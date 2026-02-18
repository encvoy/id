import Box from "@mui/material/Box";
import { FC, useRef } from "react";
import { ILogEvent } from "../../shared/api/logger";
import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getEventSpecific } from "src/features/eventLog/EventLogList";
import { CustomIcon } from "src/shared/ui/components/CustomIcon";

interface IEventLogInfoProps {
  selectedEvent: ILogEvent | null;
}

const EventLogInfoComponent: FC<IEventLogInfoProps> = ({ selectedEvent }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { t: translate, i18n } = useTranslation();
  const date = selectedEvent?.date ? new Date(selectedEvent?.date) : null;

  const infoSpecific = getEventSpecific(translate, selectedEvent?.event);

  return (
    <Box
      data-id="event-log-info"
      ref={ref}
      sx={{
        overflowY: "auto",
        overflowX: "hidden",
        width: "100%",
        height: "calc(100% - 40px)",
        opacity: 1,
        transition: "all ease 0.3s",
      }}
    >
      <Box sx={{ marginBottom: "32px", wordWrap: "break-word" }}>
        <Typography className="text-20-medium">{infoSpecific.tag}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CustomIcon
            colorHex={infoSpecific.color}
            Icon={infoSpecific?.icon}
            color="custom"
          />
          <Typography component="span" className="text-12">
            {selectedEvent?.event}
          </Typography>
        </Box>
      </Box>
      {date && (
        <>
          <Typography className="text-15-medium">
            {translate("pages.eventLog.dateAndTime")}
          </Typography>
          <Typography
            color="text.secondary"
            className="text-14"
            sx={{ marginBottom: "16px", wordWrap: "break-word" }}
          >
            {date?.toLocaleString(i18n.language)}
          </Typography>
        </>
      )}
      {selectedEvent?.details && (
        <>
          <Typography className="text-15-medium">
            {translate("pages.eventLog.details")}
          </Typography>
          <Typography
            color="text.secondary"
            className="text-14"
            sx={{ marginBottom: "16px", wordWrap: "break-word" }}
          >
            {selectedEvent.details}
          </Typography>
        </>
      )}
      {selectedEvent?.client_id && (
        <>
          <Typography className="text-15-medium">
            {translate("pages.eventLog.client")}
          </Typography>
          <Typography
            color="text.secondary"
            className="text-14"
            sx={{ marginBottom: "16px", wordWrap: "break-word" }}
          >
            {selectedEvent?.client_id}
          </Typography>
        </>
      )}
      {selectedEvent?.user_id && (
        <>
          <Typography className="text-15-medium">
            {translate("pages.eventLog.user")}
          </Typography>
          <Typography
            color="text.secondary"
            className="text-14"
            sx={{ marginBottom: "16px", wordWrap: "break-word" }}
          >
            {selectedEvent?.user_id}
          </Typography>
        </>
      )}
      {selectedEvent?.ip_address && (
        <>
          <Typography className="text-15-medium">
            {translate("pages.eventLog.placement")}
          </Typography>
          <Typography
            color="text.secondary"
            className="text-14"
            sx={{ marginBottom: "16px", wordWrap: "break-word" }}
          >
            {selectedEvent?.ip_address?.replace("::ffff:", "")}
          </Typography>
        </>
      )}
      {selectedEvent?.device && (
        <>
          <Typography className="text-15-medium">
            {translate("pages.eventLog.device")}
          </Typography>
          <Typography
            color="text.secondary"
            className="text-14"
            sx={{ marginBottom: "16px", wordWrap: "break-word" }}
          >
            {selectedEvent?.device}
          </Typography>
        </>
      )}
      {selectedEvent?.description && (
        <>
          <Typography className="text-15-medium">
            {translate("pages.eventLog.description")}
          </Typography>
          {selectedEvent?.description.split("::").map((str, key) => (
            <Typography
              color="text.secondary"
              key={key}
              className="text-14"
              sx={{ marginBottom: "16px", wordWrap: "break-word" }}
            >
              {str}
            </Typography>
          ))}
        </>
      )}
    </Box>
  );
};

export const EventLogInfo = EventLogInfoComponent;
