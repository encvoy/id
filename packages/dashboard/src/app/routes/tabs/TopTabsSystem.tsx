import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useSystemClientId } from "src/shared/hooks/useSystemClientId";
import { routes, tabs } from "src/shared/utils/enums";
import styles from "./TopTabs.module.css";

export const TopTabsSystem: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const systemClientId = useSystemClientId();
  const [tab, setTab] = useState<string>(tabs.system);

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const thirdSegment = segments[2];

    switch (thirdSegment) {
      case tabs.organizations:
        setTab(tabs.organizations);
        break;
      default:
        setTab(tabs.system);
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
          data-test-id="tab-system"
          icon={<SettingsOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={t("tabs.system")}
          id="0"
          value={tabs.system}
          onClick={() =>
            navigate(`/${routes.system}/${systemClientId}/${tabs.system}`)
          }
        />
        <Tab
          data-test-id="tab-organizations"
          icon={<HomeWorkOutlinedIcon />}
          iconPosition="start"
          className={styles.tab}
          label={t("tabs.organizations")}
          id="1"
          value={tabs.organizations}
          onClick={() =>
            navigate(`/${routes.system}/${systemClientId}/${tabs.organizations}`)
          }
        />
      </Tabs>
    </Box>
  );
};
