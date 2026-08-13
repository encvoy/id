import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import PersonRemoveOutlinedIcon from "@mui/icons-material/PersonRemoveOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import RestoreFromTrashOutlinedIcon from "@mui/icons-material/RestoreFromTrashOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import UnsubscribeOutlinedIcon from "@mui/icons-material/UnsubscribeOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import Box from "@mui/material/Box";
import type { ChipProps } from "@mui/material/Chip";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { ElementType, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { EEventLog, ETagColor, Order, routes } from "src/shared/utils/enums";
import { ILogEvent, useLazyGetEventsLogQuery } from "src/shared/api/logger";
import { IQuerySortParams } from "src/shared/api/types";
import { ModalInfo } from "@encvoy-id/components";
import { ListItems } from "../../shared/ui/CardsList.tsx";
import { CardEventLog, ICardEventLogProps } from "./EventLogCard";
import { EventLogInfo } from "./EventLogInfo";
import { TFunction } from "i18next";

export function getEventSpecific(
  translate: TFunction,
  code?: string
): {
  color: ETagColor;
  chipColor: NonNullable<ChipProps["color"]>;
  icon: ElementType<SvgIconProps>;
  tag: string;
} {
  switch (code) {
    case EEventLog.USER_LOGIN_SUCCESS:
      return {
        color: ETagColor.green,
        chipColor: "success",
        icon: VerifiedUserOutlinedIcon,
        tag: translate("pages.eventLog.events.successUserLogin"),
      };
    case EEventLog.USER_DELETED_DB:
      return {
        color: ETagColor.red,
        chipColor: "error",
        icon: PersonOffOutlinedIcon,
        tag: translate("pages.eventLog.events.userDeletedDb"),
      };
    case EEventLog.USER_DELETE:
      return {
        color: ETagColor.red,
        chipColor: "error",
        icon: PersonRemoveOutlinedIcon,
        tag: translate("pages.eventLog.events.userDeleted"),
      };
    case EEventLog.USER_CREATE:
      return {
        color: ETagColor.green,
        chipColor: "success",
        icon: PersonAddAltOutlinedIcon,
        tag: translate("pages.eventLog.events.userCreated"),
      };
    case EEventLog.USER_UPDATE:
      return {
        color: ETagColor.yellow,
        chipColor: "warning",
        icon: ManageAccountsOutlinedIcon,
        tag: translate("pages.eventLog.events.userUpdated"),
      };
    case EEventLog.USER_RESTORE:
      return {
        color: ETagColor.yellow,
        chipColor: "warning",
        icon: RestoreFromTrashOutlinedIcon,
        tag: translate("pages.eventLog.events.userRestored"),
      };
    case EEventLog.USER_BLOCK:
      return {
        color: ETagColor.red,
        chipColor: "error",
        icon: LockOutlinedIcon,
        tag: translate("pages.eventLog.events.userBlock"),
      };
    case EEventLog.USER_UNBLOCK:
      return {
        color: ETagColor.green,
        chipColor: "success",
        icon: LockOpenOutlinedIcon,
        tag: translate("pages.eventLog.events.userUnblock"),
      };
    case EEventLog.INVITATION_CREATE:
      return {
        color: ETagColor.green,
        chipColor: "success",
        icon: EmailOutlinedIcon,
        tag: "Invitation created",
      };
    case EEventLog.INVITATION_CONFIRM:
      return {
        color: ETagColor.green,
        chipColor: "success",
        icon: MarkEmailReadOutlinedIcon,
        tag: "Invitation accepted",
      };
    case EEventLog.INVITATION_DELETE:
      return {
        color: ETagColor.red,
        chipColor: "error",
        icon: UnsubscribeOutlinedIcon,
        tag: "Invitation deleted",
      };
    default:
      return {
        color: ETagColor.red,
        chipColor: "error",
        icon: ErrorOutlineOutlinedIcon,
        tag: code ?? "",
      };
  }
}

const EventLogComponent = () => {
  const location = useLocation();
  const { appId = "" } = useParams<{ appId: string }>();
  const { userId }: { userId: string } = location.state || {};
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ILogEvent | null>(null);
  const [getEventsLog] = useLazyGetEventsLogQuery();

  const query = (offset: number, search?: string): IQuerySortParams => {
    const filter: Record<string, string> = {};
    const queryParams: IQuerySortParams = {
      sortBy: "date",
      sortDirection: Order.DESC,
      limit: 10,
      offset,
      search: search || "",
    };

    if (userId) {
      filter.user_id = userId;
    }

    const isOrganizationContext =
      location.pathname.startsWith(`/${routes.customer}/`) ||
      location.pathname.startsWith(`/${routes.admin}/`);

    if (isOrganizationContext && appId) {
      filter.organization_id = appId;
    }

    if (Object.keys(filter).length) {
      queryParams.filter = JSON.stringify(filter);
    }

    return queryParams;
  };

  const openModal = (value: ILogEvent) => {
    setSelectedEvent(value);
    setIsOpen(true);
  };

  return (
    <Box data-id="event-logs" className="page-container">
      <Box className="content">
        <ListItems<ILogEvent, IQuerySortParams, ICardEventLogProps>
          query={query}
          getItems={getEventsLog}
          RowElement={CardEventLog}
          searchContext="eventlog"
          rowElementProps={{
            openModal: openModal,
            isUserSpecific: !!userId,
          }}
        />
        <ModalInfo isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <EventLogInfo selectedEvent={selectedEvent} />
        </ModalInfo>
      </Box>
    </Box>
  );
};

export const EventLog = EventLogComponent;
