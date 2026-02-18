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
import { useSelector } from "react-redux";
import { RootState } from "src/app/store/store";
import { CLIENT_ID } from "src/shared/utils/constants";

export const TopTabsAdmin: FC = () => {
  const navigate = useNavigate();
  const { t: translate } = useTranslation();
  const { pathname } = useLocation();

  const [tab, setTab] = useState<string>(tabs.settings);
  const orgId = useSelector(({ user }: RootState) => user.orgId);

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
          iconPosition="start"
          className={styles.tab}
          label={translate("tabs.clients")}
          id="0"
          value={tabs.clients}
          onClick={() =>
            navigate(`/${routes.admin}/${orgId || CLIENT_ID}/${tabs.clients}`)
          }
        />
        <Tab
          icon={<TocOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={translate("tabs.eventLog")}
          id="1"
          value={tabs.eventLog}
          onClick={() =>
            navigate(`/${routes.admin}/${orgId || CLIENT_ID}/${tabs.eventLog}`)
          }
        />
      </Tabs>
    </Box>
  );
};
