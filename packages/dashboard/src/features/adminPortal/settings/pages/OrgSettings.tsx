import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import Typography from "@mui/material/Typography";
import clsx from "clsx";
import Button from "node_modules/@mui/material/esm/Button/Button";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { RootState } from "src/app/store/store";
import { useGetClientInfoQuery } from "src/shared/api/clients";
import { useDeleteOrganizationMutation } from "src/shared/api/organization";
import { AccordionBlock } from "src/shared/ui/components/AccordionBlock";
import { CustomIcon } from "src/shared/ui/components/CustomIcon";
import { SubmitModal } from "src/shared/ui/modal/SubmitModal";
import { ERoles, routes, tabs } from "src/shared/utils/enums";
import { SettingsHeader } from "../components/SettingsHeader";
import styles from "./Settings.module.css";

export const OrgSettings: FC = () => {
  const { appId = "" } = useParams<{ appId: string }>();
  const { t: translate } = useTranslation();
  const navigate = useNavigate();
  const startRoutePath = useSelector(
    (state: RootState) => state.app.startRoutePath
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [deleteOrg] = useDeleteOrganizationMutation();

  const roleInApp = useSelector(({ user }: RootState) => user.roleInApp);
  const { data: client, isLoading } = useGetClientInfoQuery({ id: appId });

  if (isLoading || client === undefined) {
    return <Typography>{translate("helperText.loading")}</Typography>;
  }

  if (roleInApp !== ERoles.ADMIN) {
    return (
      <div className="page-container">
        <div className="content">
          <div>
            <Typography>
              {translate("errors.insufficientAccessRights")}
            </Typography>
            <Typography className="text-14" color="text.secondary">
              {translate("errors.insufficientAccessRightsDescription")}
            </Typography>
            <CustomIcon
              Icon={BlockOutlinedIcon}
              style={{ width: 40, height: 40 }}
              color="textSecondary"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-container">
        <div className={clsx("content", styles.content)}>
          <SettingsHeader client={client} />

          <AccordionBlock
            title={translate("pages.settings.sections.widgetAppearance")}
            onClick={() =>
              navigate(`/${startRoutePath}/${client?.client_id}/${tabs.widget}`)
            }
            mode="compact"
          />

          <AccordionBlock
            title={translate("pages.profile.sections.otherActions")}
          >
            <Button
              variant="text"
              className={styles["margin-bottom"]}
              onClick={() => setIsModalOpen(true)}
            >
              {translate("pages.settings.deleteOrg")}
            </Button>
          </AccordionBlock>

          <SubmitModal
            isOpen={isModalOpen}
            onSubmit={() => {
              deleteOrg({}).unwrap();
              window.location.href = `/${routes.profile}/${tabs.profile}`;
            }}
            onClose={() => setIsModalOpen(false)}
            title={translate("pages.settings.modals.deleteOrg.title")}
            actionButtonText={translate("actionButtons.delete")}
            mainMessage={[
              translate("pages.settings.modals.deleteOrg.mainMessage"),
            ]}
          />
        </div>
      </div>
    </>
  );
};
