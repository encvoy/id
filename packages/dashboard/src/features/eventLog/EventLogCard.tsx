import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import clsx from "clsx";
import { FC } from "react";
import { ILogEvent } from "src/shared/api/logger";
import { Typography } from "@mui/material";
import { Card, ICardProps } from "../../shared/ui/components/Card";
import { useTranslation } from "react-i18next";
import { getEventSpecific } from "src/features/eventLog/EventLogList";

export interface ICardEventLogProps extends ICardProps {
  items: ILogEvent[];
  index: number;
  openModal: (value: ILogEvent) => void;
  isUserSpecific?: boolean;
}

const CardEventLogComponent: FC<ICardEventLogProps> = (props) => {
  const { t: translate, i18n } = useTranslation();
  const { items, index, isUserSpecific, openModal } = props;
  const event = items[index] || {};
  const date = event?.date ? new Date(event?.date) : null;

  const infoSpecific = getEventSpecific(translate, event?.event);

  return (
    <Card
      {...props}
      cardId={event?.id?.toString()}
      isImage
      DefaultIcon={infoSpecific?.icon}
      onClick={() => openModal(event)}
      iconColor={infoSpecific.color}
      content={
        <Box sx={{ maxWidth: "100%" }}>
          <Box sx={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <Chip
              sx={{
                backgroundColor: infoSpecific.color,
                height: "unset",
                padding: "4px 12px",
                color: "primary.contrastText",
              }}
              label={infoSpecific?.tag}
              className={clsx("text-12")}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <Typography className="text-12" color="text.secondary">
              {translate("pages.eventLog.dateAndTime")}
            </Typography>
            <Typography className="text-12">
              {date?.toLocaleString(i18n.language) ||
                translate("helperText.loading")}
            </Typography>
          </Box>
          {!isUserSpecific && (
            <Box sx={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <Typography className="text-12" color="text.secondary">
                {translate("pages.eventLog.user")}
              </Typography>
              <Typography className="text-12">
                {event?.user_id || "-"}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <Typography className="text-12" color="text.secondary">
              {translate("pages.eventLog.client")}
            </Typography>
            <Typography className="text-12">
              {event?.client_id || "-"}
            </Typography>
          </Box>
          {event.details && (
            <Box sx={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <Typography className="text-12" color="text.secondary">
                {translate("pages.eventLog.details")}
              </Typography>
              <Typography className="text-12">{event.details}</Typography>
            </Box>
          )}
        </Box>
      }
    />
  );
};

export const CardEventLog = CardEventLogComponent;
