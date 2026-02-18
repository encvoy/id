import { FC } from "react";
import { useTranslation } from "react-i18next";
import { useGetClientInfoQuery } from "src/shared/api/clients";
import { SettingsHeader } from "../components/SettingsHeader";
import { SettingsParams } from "../components/SettingsParams";
import { RequiredFields } from "../components/RequiredFields";
import { AccordionBlock } from "src/shared/ui/components/AccordionBlock";
import { connect } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { tabs } from "src/shared/utils/enums";
import { TAppSlice } from "src/shared/lib/appSlice";
import { RootState } from "src/app/store/store";
import styles from "./Settings.module.css";
import clsx from "clsx";
import Typography from "@mui/material/Typography";

const mapStateToProps = (state: RootState) => ({
  startRoutePath: state.app.startRoutePath,
});

type TClientSettings = {
  startRoutePath: TAppSlice["startRoutePath"];
};

export const ClientSettingsComponent: FC<TClientSettings> = ({
  startRoutePath,
}) => {
  const { t: translate } = useTranslation();
  const navigate = useNavigate();
  const { appId = "", clientId = "" } =
    useParams<{ appId: string; clientId: string }>();
  const { data: client } = useGetClientInfoQuery({
    id: clientId || appId,
  });

  if (!client) {
    return <Typography>{translate("helperText.loading")}</Typography>;
  }

  if (clientId === appId) {
    return <Typography>{translate("helperText.loading")}</Typography>;
  }

  return (
    <div className="page-container">
      <div className={clsx("content", styles.content)}>
        <SettingsHeader client={client} />

        <SettingsParams client={client} />

        <AccordionBlock
          title={translate("pages.settings.sections.requiredFields")}
        >
          <RequiredFields client={client} />
        </AccordionBlock>

        <AccordionBlock
          title={translate("pages.settings.sections.widgetAppearance")}
          onClick={() =>
            navigate(
              `/${startRoutePath}/${appId}/${tabs.clients}/${clientId}/${tabs.widget}`
            )
          }
          mode="compact"
        />

        <div className="zeroBlock"></div>
      </div>
    </div>
  );
};

export const ClientSettings = connect(mapStateToProps)(ClientSettingsComponent);
