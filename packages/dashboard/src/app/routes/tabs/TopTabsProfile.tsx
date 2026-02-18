import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import TocOutlinedIcon from "@mui/icons-material/TocOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { FC, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { routes, tabs } from "src/shared/utils/enums";
import styles from "./TopTabs.module.css";
import { useTranslation } from "react-i18next";

export const TopTabsProfile: FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t: translate } = useTranslation();
  const [tab, setTab] = useState<string>(tabs.profile);

  useEffect(() => {
    if (pathname.endsWith(tabs.profile)) setTab(tabs.profile);
    if (pathname.endsWith(tabs.scopes)) setTab(tabs.scopes);
    if (pathname.endsWith(tabs.eventLog)) setTab(tabs.eventLog);
    if (pathname.endsWith(tabs.request)) setTab(tabs.request);
  }, [pathname]);

  return (
    <Box className={styles.tabContainer}>
      <Tabs
        className={styles.tabs}
        value={tab}
        classes={{ indicator: styles.tabIndicator }}
      >
        <Tab
          icon={<AccountCircleOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={translate("tabs.profile")}
          id="0"
          value={tabs.profile}
          onClick={() => navigate(`/${routes.profile}/${tabs.profile}`)}
        />
        <Tab
          icon={<GppGoodOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={translate("tabs.scopes")}
          id="1"
          value={tabs.scopes}
          onClick={() => navigate(`/${routes.profile}/${tabs.scopes}`)}
        />
        <Tab
          icon={<TocOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={translate("tabs.eventLog")}
          id="2"
          value={tabs.eventLog}
          onClick={() => navigate(`/${routes.profile}/${tabs.eventLog}`)}
        />
        <Tab
          icon={<NotificationsActiveOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={translate("tabs.request")}
          id="3"
          value={tabs.request}
          onClick={() => navigate(`/${routes.profile}/${tabs.request}`)}
        />
      </Tabs>
    </Box>
  );
};
