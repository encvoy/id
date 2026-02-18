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
import { CLIENT_ID } from "src/shared/utils/constants";
import { routes, tabs } from "src/shared/utils/enums";
import styles from "./TopTabs.module.css";

export const TopTabsOwner: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { pathname } = useLocation();
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
            navigate(`/${routes.system}/${CLIENT_ID}/${tabs.settings}`)
          }
        />
        <Tab
          icon={<LayersOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={t("tabs.clients")}
          id="2"
          value={tabs.clients}
          onClick={() =>
            navigate(`/${routes.system}/${CLIENT_ID}/${tabs.clients}`)
          }
        />
        <Tab
          icon={<PeopleAltOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={t("tabs.users")}
          id="3"
          value={tabs.users}
          onClick={() =>
            navigate(`/${routes.system}/${CLIENT_ID}/${tabs.users}`)
          }
        />
        <Tab
          icon={<TocOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={t("tabs.eventLog")}
          id="4"
          value={tabs.eventLog}
          onClick={() =>
            navigate(`/${routes.system}/${CLIENT_ID}/${tabs.eventLog}`)
          }
        />
      </Tabs>
    </Box>
  );
};
