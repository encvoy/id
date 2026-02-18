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
import { FC, useState } from "react";
import { useLocation } from "react-router-dom";
import { EEventLog, Order } from "src/shared/utils/enums";
import { ILogEvent, useLazyGetEventsLogQuery } from "src/shared/api/logger";
import { IQuerySortParams } from "src/shared/api/types";
import { ModalInfo } from "src/shared/ui/modal/ModalInfo";
import { ListItems } from "../../shared/ui/listElements";
import { CardEventLog, ICardEventLogProps } from "./EventLogCard";
import { EventLogInfo } from "./EventLogInfo";
import { TFunction } from "i18next";

enum ETagColor {
  red = "#990000",
  green = "#006633",
  yellow = "#CC9900",
}

export function getEventSpecific(translate: TFunction, code?: string) {
  switch (code) {
    case EEventLog.USER_LOGIN_SUCCESS:
      return {
        color: ETagColor.green,
        icon: VerifiedUserOutlinedIcon,
        tag: translate("pages.eventLog.events.successUserLogin"),
      };
    case EEventLog.USER_DELETED_DB:
      return {
        color: ETagColor.red,
        icon: PersonOffOutlinedIcon,
        tag: translate("pages.eventLog.events.userDeletedDb"),
      };
    case EEventLog.USER_DELETE:
      return {
        color: ETagColor.red,
        icon: PersonRemoveOutlinedIcon,
        tag: translate("pages.eventLog.events.userDeleted"),
      };
    case EEventLog.USER_CREATE:
      return {
        color: ETagColor.green,
        icon: PersonAddAltOutlinedIcon,
        tag: translate("pages.eventLog.events.userCreated"),
      };
    case EEventLog.USER_UPDATE:
      return {
        color: ETagColor.yellow,
        icon: ManageAccountsOutlinedIcon,
        tag: translate("pages.eventLog.events.userUpdated"),
      };
    case EEventLog.USER_RESTORE:
      return {
        color: ETagColor.yellow,
        icon: RestoreFromTrashOutlinedIcon,
        tag: translate("pages.eventLog.events.userRestored"),
      };
    case EEventLog.USER_BLOCK:
      return {
        color: ETagColor.red,
        icon: LockOutlinedIcon,
        tag: translate("pages.eventLog.events.userBlock"),
      };
    case EEventLog.USER_UNBLOCK:
      return {
        color: ETagColor.green,
        icon: LockOpenOutlinedIcon,
        tag: translate("pages.eventLog.events.userUnblock"),
      };
    case EEventLog.INVITATION_CREATE:
      return {
        color: ETagColor.green,
        icon: EmailOutlinedIcon,
        tag: "Создано приглашение",
      };
    case EEventLog.INVITATION_CONFIRM:
      return {
        color: ETagColor.green,
        icon: MarkEmailReadOutlinedIcon,
        tag: "Приглашение подтверждено",
      };
    case EEventLog.INVITATION_DELETE:
      return {
        color: ETagColor.red,
        icon: UnsubscribeOutlinedIcon,
        tag: "Приглашение удалено",
      };
    default:
      return {
        color: ETagColor.red,
        icon: ErrorOutlineOutlinedIcon,
        tag: code,
      };
  }
}

const EventLogComponent: FC = () => {
  const location = useLocation();
  const { userId }: { userId: string } = location.state || {};
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ILogEvent | null>(null);
  const [getEventsLog] = useLazyGetEventsLogQuery();

  const query = (offset: number, search?: string): IQuerySortParams => {
    const queryParams: IQuerySortParams = {
      sortBy: "date",
      sortDirection: Order.DESC,
      limit: "10",
      offset,
      search: search || "",
    };

    if (userId) {
      queryParams.filter = JSON.stringify({ user_id: parseInt(userId, 10) });
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
