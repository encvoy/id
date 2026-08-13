import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import TocOutlinedIcon from "@mui/icons-material/TocOutlined";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { FC, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { routes, tabs } from "src/shared/utils/enums";
import styles from "./TopTabs.module.css";
import { useSystemClientId } from "src/shared/hooks/useSystemClientId";

export const TopTabsAdmin: FC = () => {
  const navigate = useNavigate();
  const { t: translate } = useTranslation();
  const { pathname } = useLocation();
  const systemClientId = useSystemClientId();

  const [tab, setTab] = useState<string>(tabs.settings);

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const thirdSegment = segments[2];

    switch (thirdSegment) {
      case tabs.eventLog:
        setTab(tabs.eventLog);
        break;
      default:
        setTab(tabs.clients);
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
          icon={<LayersOutlinedIcon />}
          data-test-id="tab-applications"
          iconPosition="start"
          className={styles.tab}
          label={translate("tabs.clients")}
          id="0"
          value={tabs.clients}
          onClick={() =>
            navigate(`/${routes.admin}/${systemClientId}/${tabs.clients}`)
          }
        />
        <Tab
          icon={<TocOutlinedIcon />}
          data-test-id="tab-logs"
          iconPosition="start"
          className={styles.tab}
          label={translate("tabs.eventLog")}
          id="1"
          value={tabs.eventLog}
          onClick={() =>
            navigate(`/${routes.admin}/${systemClientId}/${tabs.eventLog}`)
          }
        />
      </Tabs>
    </Box>
  );
};
