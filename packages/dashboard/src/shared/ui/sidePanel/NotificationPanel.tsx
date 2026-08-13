import {NotificationPanel as UiNotificationPanel} from "@encvoy-id/components";
import {connect, useDispatch} from "react-redux";
import {useTranslation} from "react-i18next";
import {
  setIsNotificationPanelOpen,
  TAppSlice,
} from "src/shared/slices/appSlice.ts";
import {
  deleteAllNotices,
  deleteNotice,
  setIsReadNotice,
  TNotice,
} from "src/shared/slices/noticesSlice.ts";
import {RootState} from "../../../app/store/store.ts";

interface INotificationPanelProps {
  isNotificationPanelOpen: TAppSlice["isNotificationPanelOpen"];
  notices: TNotice[];
}

const mapStateToProps = (state: RootState) => ({
  isNotificationPanelOpen: state.app.isNotificationPanelOpen,
  notices: state.notices.notices,
});

const NotificationPanelComponent = (
  {isNotificationPanelOpen, notices}: INotificationPanelProps
) => {
  const dispatch = useDispatch();
  const {t, i18n} = useTranslation();

  const handleClosePanel = () => {
    dispatch(setIsNotificationPanelOpen(false));
    dispatch(setIsReadNotice(true));
  };

  return (
    <UiNotificationPanel
      isOpen={isNotificationPanelOpen}
      notices={notices}
      locale={i18n.resolvedLanguage || i18n.language}
      labels={{
        title: t("panel.notification.title"),
        newNotifications: t("panel.notification.newNotifications"),
        clear: t("panel.notification.clear"),
        empty: t("panel.notification.empty"),
        delete: t("panel.notification.delete"),
      }}
      onClose={handleClosePanel}
      onClear={() => dispatch(deleteAllNotices())}
      onDelete={(id) => {
        if (typeof id === "number") dispatch(deleteNotice(id));
      }}
    />
  );
};

export const NotificationPanel = connect(mapStateToProps)(
  NotificationPanelComponent
);
