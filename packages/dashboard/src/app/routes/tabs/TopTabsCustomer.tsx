import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import TocOutlinedIcon from "@mui/icons-material/TocOutlined";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { FC, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { routes, tabs } from "src/shared/utils/enums";
import styles from "./TopTabs.module.css";
import { useSelector } from "react-redux";
import { RootState } from "src/app/store/store";

export const TopTabsCustomer: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const orgId = useSelector(({ user }: RootState) => user.orgId);
  const { pathname } = useLocation();
  const [tab, setTab] = useState<string>(tabs.settings);

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const thirdSegment = segments[2];

    switch (thirdSegment) {
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
        borderBottom: 1,
        borderBottomColor: "divider",
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
            navigate(`/${routes.customer}/${orgId}/${tabs.settings}`)
          }
        />
        <Tab
          icon={<LayersOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={t("tabs.clients")}
          id="1"
          value={tabs.clients}
          onClick={() =>
            navigate(`/${routes.customer}/${orgId}/${tabs.clients}`)
          }
        />
        <Tab
          icon={<TocOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={t("tabs.eventLog")}
          id="2"
          value={tabs.eventLog}
          onClick={() =>
            navigate(`/${routes.customer}/${orgId}/${tabs.eventLog}`)
          }
        />
      </Tabs>
    </Box>
  );
};
