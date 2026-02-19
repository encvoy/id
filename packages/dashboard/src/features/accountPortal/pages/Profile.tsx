import Button from "@mui/material/Button";
import { FC, useState } from "react";
import { connect, useDispatch } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/material/Link";
import { useTranslation } from "react-i18next";
import { ProviderType } from "src/shared/api/provider";
import {
  useGetPrivateClaimsQuery,
  useLazyDeleteAllSessionQuery,
  useUpdateUserMutation,
} from "src/shared/api/users";
import { ERoles, routes, subTabs, tabs } from "src/shared/utils/enums";
import {
  exportToJson,
  formatPhoneNumber,
  getImageURL,
} from "src/shared/utils/helpers";
import { setNoticeInfo } from "src/shared/lib/noticesSlice";
import {
  useGetProfileFieldsQuery,
  useGetSettingsQuery,
} from "src/shared/api/settings";
import { RootState } from "src/app/store/store";
import { TUserSlice } from "src/shared/lib/userSlice";
import { Box, Typography } from "@mui/material";
import { SubmitModal } from "src/shared/ui/modal/SubmitModal";
import { PublicProfileBlock } from "../components/PublicProfileBlock";
import { UserProfileField } from "../components/UserProfileField";
import { ExternalAccount } from "../../../shared/ui/ExternalAccount";
import { PublicProfilePanel } from "../components/PublicProfilePanel";
import styles from "./Profile.module.css";
import { useGetExternalAccountsQuery } from "src/shared/api/profile";
import { IconsLibrary } from "../../../shared/ui/components/IconLibrary";
import { setNoticeError } from "src/shared/lib/noticesSlice";
import { AccordionBlock } from "src/shared/ui/components/AccordionBlock";
import { componentBorderRadius } from "src/shared/theme/Theme";

interface IProfileProps {
  profile: TUserSlice["profile"];
  roleInApp: TUserSlice["roleInApp"];
}

const mapStateToProps = ({ user }: RootState) => ({
  profile: user.profile,
  roleInApp: user.roleInApp,
});

const ProfileComponent: FC<IProfileProps> = ({ profile, roleInApp }) => {
  const dispatch = useDispatch();
  const { t: translate, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const date = profile.birthdate ? new Date(profile.birthdate) : null;
  const passwordUpdateDate = new Date(profile.password_updated_at || "");
  const { data: externalAccounts } = useGetExternalAccountsQuery(
    String(profile.id),
    {
      skip: !profile.id,
    }
  );
  const { data: profileFields } = useGetProfileFieldsQuery();
  const { data: privateClaims } = useGetPrivateClaimsQuery(String(profile.id), {
    skip: !profile.id,
  });
  const { data: dataSettings } = useGetSettingsQuery();
  const [deleteAllSession] = useLazyDeleteAllSessionQuery();
  const [updateUser] = useUpdateUserMutation();

  const [isOutModalOpen, setOutModalOpen] = useState(false);
  const [isOpenPublicPanel, setIsOpenPublicPanel] = useState(false);
  const [agreeModal, setAgreeModal] = useState(false);
  const [typeContact, setTypeContact] = useState<string>("");

  const handleOpenPublicPanel = () => {
    if (profile.email) {
      setIsOpenPublicPanel(true);
    } else {
      dispatch(
        setNoticeInfo(translate("pages.profile.notices.publicDataRequireEmail"))
      );
    }
  };

  const customFields =
    profileFields?.filter((field) => field.type === "custom" && field.active) ||
    [];
  const lineCustomFields = customFields.map((field) => {
    return (
      <UserProfileField
        key={field.field}
        title={field.title}
        value={
          profile.custom_fields && profile.custom_fields[field.field]
            ? (profile.custom_fields[field.field] as string)
            : translate("helperText.value.notSet")
        }
        privateClaims={privateClaims}
        fieldName={field.field}
        userId={profile.id}
      />
    );
  });

  const handleDeleteEmail = () => {
    setTypeContact("email");
    setAgreeModal(true);
  };

  const handleDeletePhone = () => {
    setTypeContact("phone");
    setAgreeModal(true);
  };

  const handleContact = async () => {
    try {
      await updateUser({
        body: typeContact === "email" ? { email: "" } : { phone_number: "" },
        userId: profile?.id || "",
      }).unwrap();
    } catch (e) {
      console.error("err", e);
      dispatch(setNoticeError(translate("info.updateError")));
    }
    setAgreeModal(false);
  };

  return (
    <div className="page-container">
      <div className="content">
        <Typography
          style={{ marginBottom: 14 }}
          className="text-14"
          color="text.secondary"
        >
          {translate("pages.profile.description")}
        </Typography>

        <Box
          className={styles.panel}
          sx={{ borderRadius: componentBorderRadius }}
        >
          <div className={styles.panelTitle}>
            <Typography className="text-17">
              {translate("helperText.mainInfo")}
            </Typography>
            {roleInApp !== ERoles.TRUSTED_USER && (
              <Link
                component={RouterLink}
                to={`/${routes.profile}/${tabs.profile}/${subTabs.edit}`}
              >
                {translate("actionButtons.edit")}
              </Link>
            )}
          </div>
          <div>
            <UserProfileField
              title={translate("pages.profile.fields.userId")}
              value={profile.id}
              privateClaims={privateClaims}
              userId={profile.id}
              fieldName="id"
              disabled
            />
            <UserProfileField
              title={translate("pages.profile.fields.publicName")}
              value={profile.nickname || translate("helperText.value.notSet")}
              privateClaims={privateClaims}
              userId={profile.id}
              fieldName="nickname"
            />
            <UserProfileField
              title={translate("pages.profile.fields.profilePhoto")}
              privateClaims={privateClaims}
              fieldName="picture"
              userId={profile.id}
              isMaxSize
              urlImage={getImageURL(profile?.picture)}
            />
            <UserProfileField
              title={translate("pages.profile.fields.fullName")}
              value={
                (
                  (profile.given_name || "") +
                  " " +
                  (profile.family_name || "")
                ).trim() || translate("helperText.value.notSet")
              }
              privateClaims={privateClaims}
              userId={profile.id}
              otherField="family_name"
              fieldName="family_name given_name"
            />
            <UserProfileField
              title={translate("pages.profile.fields.login")}
              value={profile.login || translate("helperText.value.notSet")}
              privateClaims={privateClaims}
              userId={profile.id}
              fieldName="login"
            />
            <UserProfileField
              title={translate("pages.profile.fields.birthDate")}
              value={
                date
                  ? date.toLocaleDateString(currentLanguage)
                  : translate("helperText.value.notSet")
              }
              privateClaims={privateClaims}
              userId={profile.id}
              fieldName="birthdate"
            />
            {lineCustomFields.length > 0 && (
              <Typography className="text-17">
                {translate("helperText.additionalInfo")}
              </Typography>
            )}
            {lineCustomFields}
          </div>
        </Box>

        <Box
          className={styles.panel}
          sx={{ borderRadius: componentBorderRadius }}
        >
          <div className={styles.panelTitle}>
            <Typography className="text-17">
              {translate("pages.profile.sections.contacts")}
            </Typography>
          </div>
          <div>
            <UserProfileField
              title={translate("pages.profile.fields.email")}
              value={profile.email || translate("helperText.value.notSet")}
              privateClaims={privateClaims}
              userId={profile.id}
              fieldName="email"
            >
              {profileFields?.find((field) => field.field === "email")
                ?.editable &&
                roleInApp !== ERoles.TRUSTED_USER && (
                  <Link
                    component={RouterLink}
                    to={`/${routes.profile}/email/${
                      profile.email ? "change" : "add"
                    }`}
                  >
                    {translate("actionButtons.edit")}
                  </Link>
                )}
              {profile.email && roleInApp !== ERoles.TRUSTED_USER && (
                <IconsLibrary type="delete" onClick={handleDeleteEmail} />
              )}
            </UserProfileField>
            <UserProfileField
              title={translate("pages.profile.fields.phone")}
              value={
                profile.phone_number
                  ? formatPhoneNumber(profile.phone_number)
                  : translate("helperText.value.notSet")
              }
              privateClaims={privateClaims}
              userId={profile.id}
              fieldName="phone_number"
            >
              {profileFields?.find((field) => field.field === "phone_number")
                ?.editable &&
                roleInApp !== ERoles.TRUSTED_USER && (
                  <Link
                    component={RouterLink}
                    to={`/${routes.profile}/phone/${
                      profile.phone_number ? "change" : "add"
                    }`}
                  >
                    {translate("actionButtons.edit")}
                  </Link>
                )}
              {profile.phone_number && roleInApp !== ERoles.TRUSTED_USER && (
                <IconsLibrary type="delete" onClick={handleDeletePhone} />
              )}
            </UserProfileField>
          </div>
        </Box>

        <Box
          className={styles.panel}
          sx={{ borderRadius: componentBorderRadius }}
        >
          <div className={styles.panelTitle}>
            <Typography className="text-17">
              {translate("pages.profile.sections.identifiers")}
            </Typography>
            <Link
              component={RouterLink}
              to={`/${routes.profile}/external-provider`}
            >
              {translate("actionButtons.add")}
            </Link>
          </div>
          <div>
            {externalAccounts
              ?.filter(
                (ea) =>
                  ea.type !== ProviderType.EMAIL &&
                  ea.type !== ProviderType.PHONE
              )
              .map((account) => (
                <ExternalAccount
                  account={account}
                  userProfileId={profile?.id}
                  key={
                    (account.sub || "") +
                    (account.issuer || "") +
                    (account.type || "")
                  }
                  withoutButtons={false}
                />
              ))}
          </div>
        </Box>
        <Box
          className={styles.panel}
          sx={{ borderRadius: componentBorderRadius }}
        >
          <div className={styles.panelTitle}>
            <Typography className="text-17">
              {translate("pages.profile.sections.privacy")}
            </Typography>
          </div>
          <PublicProfileBlock onOpenDrawer={handleOpenPublicPanel} />
        </Box>

        <AccordionBlock
          title={translate("pages.profile.sections.otherActions")}
        >
          {dataSettings?.data_processing_agreement && (
            <Link
              href={dataSettings.data_processing_agreement}
              target="_blank"
              rel="noreferrer"
            >
              {translate("pages.profile.actions.privacyPolicy")}
            </Link>
          )}

          {profile.id && parseInt(profile.id, 10) !== 1 && (
            <Link component={RouterLink} to={subTabs.delete}>
              {translate("actionButtons.deleteAccount")}
            </Link>
          )}

          <div className={styles.actions}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOutModalOpen(true)}
            >
              {translate("pages.profile.actions.logoutAllDevices")}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => exportToJson({ ...profile }, "profile.json")}
            >
              {translate("pages.profile.actions.downloadData")}
            </Button>
          </div>
        </AccordionBlock>
        <div className="zeroBlock"></div>
      </div>

      <PublicProfilePanel
        email={profile.email || ""}
        isOpen={isOpenPublicPanel}
        onClose={() => setIsOpenPublicPanel(false)}
      />

      <SubmitModal
        title={translate("pages.profile.modals.confirmDeletion.title")}
        mainMessage={[
          translate("pages.profile.modals.confirmDeletion.message"),
        ]}
        isOpen={agreeModal}
        onClose={() => setAgreeModal(false)}
        onSubmit={handleContact}
      />

      <SubmitModal
        title={translate("pages.profile.modals.logoutAllDevices.title")}
        mainMessage={[
          translate("pages.profile.modals.logoutAllDevices.message"),
        ]}
        actionButtonText={translate("actionButtons.continue")}
        isOpen={isOutModalOpen}
        onSubmit={async () => {
          setOutModalOpen(false);
          await deleteAllSession(profile.id);
          window.location.reload();
        }}
        onClose={() => setOutModalOpen(false)}
      />
    </div>
  );
};

export const Profile = connect(mapStateToProps)(ProfileComponent);
