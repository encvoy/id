import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import TocOutlinedIcon from "@mui/icons-material/TocOutlined";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { FC, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSystemClientId } from "src/shared/hooks/useSystemClientId";
import { routes, tabs } from "src/shared/utils/enums";
import styles from "./TopTabs.module.css";

export const TopTabsOwner: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const systemClientId = useSystemClientId();
  const [tab, setTab] = useState<string>(tabs.settings);

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const thirdSegment = segments[2];

    switch (thirdSegment) {
      case tabs.users:
        setTab(tabs.users);
        break;
      case tabs.clients:
        setTab(tabs.clients);
        break;
      case tabs.eventLog:
        setTab(tabs.eventLog);
        break;
      case tabs.system:
      case tabs.systemProfileSettings:
      default:
        setTab(tabs.settings);
        break;
    }
  }, [pathname]);

  return (
    <Box
      className={styles.tabContainer}
      sx={{
        backgroundColor: "background.default",
      }}
    >
      <Tabs
        className={styles.tabs}
        classes={{ indicator: styles.tabIndicator }}
        value={tab}
      >
        <Tab
          icon={<SettingsOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={t("tabs.settings")}
          id="0"
          value={tabs.settings}
          onClick={() =>
            navigate(`/${routes.system}/${systemClientId}/${tabs.settings}`)
          }
          data-test-id="tab-settings"
        />
        <Tab
          icon={<LayersOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={t("tabs.clients")}
          id="1"
          value={tabs.clients}
          onClick={() =>
            navigate(`/${routes.system}/${systemClientId}/${tabs.clients}`)
          }
          data-test-id="tab-applications"
        />
        <Tab
          icon={<PeopleAltOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={t("tabs.users")}
          id="2"
          value={tabs.users}
          onClick={() =>
            navigate(`/${routes.system}/${systemClientId}/${tabs.users}`)
          }
          data-test-id="tab-users"
        />
        <Tab
          icon={<TocOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={t("tabs.eventLog")}
          id="3"
          value={tabs.eventLog}
          onClick={() =>
            navigate(`/${routes.system}/${systemClientId}/${tabs.eventLog}`)
          }
          data-test-id="tab-logs"
        />
      </Tabs>
    </Box>
  );
};
